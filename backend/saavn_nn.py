import base64
import json
from traceback import print_exc
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Union

import requests
from fastapi.applications import FastAPI
import threading
from pyDes import ECB
from pyDes import PAD_PKCS5
from pyDes import des
from pydantic import BaseModel
from pydantic import validator

app = FastAPI()

base_url = "https://www.jiosaavn.com/api.php"

# Thread lock for DES decryption to prevent state corruption during concurrent requests
des_lock = threading.Lock()


################################################################################
# pydantic models
################################################################################
class Artist(BaseModel):
    id: int
    name: str
    role: str
    image: str
    type: str
    perma_url: str

    @validator('image', allow_reuse = True)
    def fix_artist_image(cls, v):
        return fix_image_url(v)


class ArtistsMap(BaseModel):
    primary_artists: List[Artist]
    featured_artists: List[Artist]
    artists: List[Artist]


class SongDetails(BaseModel):
    id: str
    title: str
    subtitle: Optional[str] = ""
    type: str = "song"
    perma_url: Optional[str] = ""
    image: str
    language: Optional[str] = "hindi"
    play_count: Optional[int] = None
    explicit_content: Optional[bool] = None
    list_count: Optional[int] = None
    list_type: Optional[str] = None
    list: Any = None
    music: Optional[str] = ""
    album: Optional[str] = "Single"
    album_id: Optional[str] = ""
    album_url: Optional[str] = ""
    label: Optional[str] = ""
    origin: Optional[str] = "none"
    is_320kbps: Optional[bool] = True
    encrypted_media_url: str
    media_url: str
    media_url_default: str
    duration: Optional[int] = 180
    has_lyrics: Optional[bool] = False
    lyrics_snippet: Optional[str] = ""
    lyrics_id: Optional[str] = None
    starred: Optional[bool] = False
    copyright_text: Optional[str] = ""
    artistMap: Optional[Union[ArtistsMap, Dict[str, Any]]] = None
    release_date: Optional[str] = ""
    year: Optional[Union[int, str]] = 0
    vlink: Optional[str] = None

    @validator('title', 'subtitle', 'album', allow_reuse = True)
    def fix_title_(cls, v):
        return fix_title(v)

    @validator('image', allow_reuse = True)
    def fix_image(cls, v):
        return fix_image_url(v)


class AlbumDetails(BaseModel):
    id: int
    title: str
    subtitle: str
    type: str
    perma_url: str
    image: str
    language: str
    year: int
    play_count: str
    explicit_content: bool
    list_count: int
    list_type: str
    songs: List[SongDetails]

    # @validator('title', 'subtitle')
    # def fix_title_(cls, v):
    #     return fix_title(v)

    @validator('image', allow_reuse = True)
    def fix_image(cls, v):
        return fix_image_url(v)


class PlaylistDetails(AlbumDetails):
    # more_info
    uid: str
    last_updated: str
    username: str
    firstname: str
    lastname: str
    follower_count: int
    fan_count: int


################################################################################
# jiosaavn_api functions
################################################################################
def jiosaavn_request(search_params, headers = None, resp_only = False) -> Union[
    requests.Response, Dict, None]:
    if headers is None:
        headers = {}
    search_params = {'api_version': 4, '_format': 'json', '_marker': 0,
                     **search_params}
    headers = {
        # "Host": "c.saavncdn.com",
        "Referer": "https://www.jiosaavn.com",
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/84.0.4147.89 Safari/537.36 "
                      "Edg/84.0.522.40",
        **headers
    }
    resp = requests.get(base_url, params = search_params, headers = headers)
    if resp_only:
        return resp
    try:
        return resp.json()
    except:
        print_exc()
        print(resp.text)
        try:
            return json.loads(resp.text.strip())
        except:
            print_exc()
            return None


def search_query(query: str) -> List[SongDetails]:
    # 1. Try search.getResults for rich multi-song catalog
    try:
        res = jiosaavn_request({
            '__call': "search.getResults",
            'q': query,
            'p': 1,
            'n': 18
        })
        if res and isinstance(res, dict) and 'results' in res and len(res['results']) > 0:
            songs = []
            for item in res['results']:
                try:
                    if 'more_info' in item and item['more_info'].get('encrypted_media_url'):
                        s = fix_song_details(item)
                        if s:
                            songs.append(s)
                except Exception:
                    continue
            if len(songs) > 0:
                return songs
    except Exception:
        pass

    # 2. Fallback to autocomplete.get
    try:
        query_results = jiosaavn_request({
            '__call': "autocomplete.get",
            'ctx': "wap6dot0",
            'query': query
        })
        if query_results and "songs" in query_results and "data" in query_results["songs"]:
            songs = []
            for song in query_results["songs"]['data']:
                try:
                    s = get_song_details(song['id'])
                    if s:
                        songs.append(s)
                except Exception:
                    continue
            return songs
    except Exception:
        pass

    return []


def get_song_details(song_id: str) -> Union[SongDetails, None]:
    resp = jiosaavn_request({
        '__call': "song.getDetails",
        'pids': song_id,
        # 'ctx': "wap6dot0",
    })
    if resp is None:
        return None
    return fix_song_details(resp[song_id])


def get_song_details_from_url(song_url: str) -> SongDetails:
    resp = jiosaavn_request({
        "__call": "webapi.get",
        "token": song_url,
        "type": "song"
    })
    if resp is None:
        return None
    if type(resp) == dict and len(resp) == 1:
        return fix_song_details(resp.popitem()[1])
    else:
        print("Error", resp)
        return None


def fix_song_details(song_details) -> Union[SongDetails, None]:
    try:
        song_more_details = song_details.get("more_info", {})
        encrypted_media_url = song_more_details.get("encrypted_media_url", "")
        if not encrypted_media_url:
            return None

        default_media_url, media_url = decrypt_url(encrypted_media_url)
        song_details["media_url"] = media_url
        song_details["media_url_default"] = default_media_url

        is_320 = str(song_more_details.get("320kbps", "true")).lower() in ("true", "1")
        artist_map = song_more_details.get("artistMap")
        if not isinstance(artist_map, dict):
            artist_map = {"primary_artists": [], "featured_artists": [], "artists": []}

        duration_val = 180
        raw_dur = song_more_details.get("duration") or song_details.get("duration")
        if raw_dur:
            try:
                duration_val = int(raw_dur)
            except Exception:
                pass

        year_val = 0
        raw_yr = song_details.get("year") or song_more_details.get("year")
        if raw_yr:
            try:
                year_val = int(raw_yr)
            except Exception:
                pass

        return SongDetails(
            id=str(song_details.get("id", "")),
            title=str(song_details.get("title", "")),
            subtitle=str(song_details.get("subtitle", "") or ""),
            type="song",
            perma_url=str(song_details.get("perma_url", "") or ""),
            image=str(song_details.get("image", "") or ""),
            language=str(song_details.get("language", "") or "hindi"),
            play_count=int(song_details.get("play_count") or 0) if song_details.get("play_count") else None,
            music=str(song_more_details.get("music", "") or ""),
            album=str(song_more_details.get("album", "") or song_details.get("album", "") or "Single"),
            album_id=str(song_more_details.get("album_id", "") or ""),
            album_url=str(song_more_details.get("album_url", "") or ""),
            label=str(song_more_details.get("label", "") or ""),
            origin=str(song_more_details.get("origin", "") or "none"),
            is_320kbps=is_320,
            encrypted_media_url=encrypted_media_url,
            media_url=media_url,
            media_url_default=default_media_url,
            duration=duration_val,
            has_lyrics=str(song_more_details.get("has_lyrics", "")).lower() in ("true", "1"),
            lyrics_snippet=str(song_more_details.get("lyrics_snippet", "") or ""),
            lyrics_id=str(song_more_details.get("lyrics_id", "") or "") or None,
            starred=False,
            copyright_text=str(song_more_details.get("copyright_text", "") or ""),
            artistMap=artist_map,
            release_date=str(song_more_details.get("release_date", "") or ""),
            year=year_val,
            vlink=str(song_more_details.get("vlink", "") or "") or None
        )
    except Exception as e:
        print("fix_song_details error:", e)
        return None


def get_album_details(album_id: str) -> AlbumDetails:
    album_results = jiosaavn_request({
        "__call": "content.getAlbumDetails",
        "albumid": album_id
    })
    if album_results is None:
        return None
    return AlbumDetails(**album_results, songs = list(
        map(fix_song_details, album_results["list"])))


def get_album_details_from_url(album_url: str) -> AlbumDetails:
    album_results = jiosaavn_request({
        "__call": "webapi.get",
        "token": album_url,
        "type": "album"
    })
    if album_results is None:
        return None
    return AlbumDetails(**album_results, songs = list(
        map(fix_song_details, album_results["list"])))


def get_playlist_details(playlist_id: str, page_no: int) -> PlaylistDetails:
    playlist_details = jiosaavn_request({
        "__call": "playlist.getDetails",
        "listid": playlist_id,
        "p": page_no
    })
    if playlist_details is None:
        return None
    return PlaylistDetails(
        **playlist_details, **playlist_details["more_info"], songs = list(
            map(fix_song_details, playlist_details["list"])))


def get_playlist_details_from_url(
        playlist_url: str, page_no: int) -> PlaylistDetails:
    playlist_details = jiosaavn_request({
        "__call": "webapi.get",
        "token": playlist_url,
        "type": "playlist",
        "p": page_no
    })
    if playlist_details is None:
        return None
    return PlaylistDetails(
        **playlist_details, **playlist_details["more_info"], songs = list(
            map(fix_song_details, playlist_details["list"])))


def get_lyrics(song_id: str):
    lyrics_json = jiosaavn_request({
        "__call": "lyrics.getLyrics",
        "lyrics_id": song_id,
        "ctx": "wap6dot0"
    })
    return lyrics_json


################################################################################
# utility functions
################################################################################
def decrypt_url(url):
    try:
        enc_url = base64.b64decode(url.strip())
        with des_lock:
            cipher = des(b"38346591", ECB, b"\0\0\0\0\0\0\0\0", pad = None, padmode = PAD_PKCS5)
            dec_bytes = cipher.decrypt(enc_url, padmode = PAD_PKCS5)
        default_dec_url = dec_bytes.decode('utf-8', errors='ignore').strip()

        # Sanity check: must be a valid http URL without corrupted control characters
        if not default_dec_url.startswith('http') or any(ord(c) < 32 or ord(c) > 126 for c in default_dec_url):
            # Retry once with a fresh cipher
            with des_lock:
                cipher = des(b"38346591", ECB, b"\0\0\0\0\0\0\0\0", pad = None, padmode = PAD_PKCS5)
                dec_bytes = cipher.decrypt(enc_url, padmode = PAD_PKCS5)
            default_dec_url = dec_bytes.decode('utf-8', errors='ignore').strip()

        if not default_dec_url.startswith('http'):
            return "", ""

        dec_url = default_dec_url.replace("_96.mp4", "_320.mp3")
        return default_dec_url, dec_url
    except Exception:
        return "", ""


def fix_image_url(url):
    url = str(url)
    if 'http://' in url:
        url = url.replace("http://", "https://")
    url = url.replace('150x150', '500x500')
    return url


def fix_title(title):
    title = title.replace('&quot;', '')
    return title


def expand_url(url):
    try:
        session = requests.Session()
        resp = session.head(url, allow_redirects = True)
        return (resp.url)
    except Exception as e:
        print("URL Redirect Error: ", e)
        return url


def check_media_url(dec_url):
    ex_dec_url = expand_url(dec_url)
    r = requests.head(ex_dec_url)
    if r.status_code != 200:
        fixed_dec_url = dec_url.replace(".mp3", '.mp4')
        fixed_dec_url = expand_url(fixed_dec_url)
        return fixed_dec_url
    return ex_dec_url
