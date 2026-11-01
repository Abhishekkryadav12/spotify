from typing import Dict
from typing import List
from typing import Optional
from typing import Union

from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.responses import RedirectResponse
from fastapi.responses import StreamingResponse

from file_downloader import TaskManager
from saavn_nn import AlbumDetails
from saavn_nn import PlaylistDetails
from saavn_nn import SongDetails
from saavn_nn import check_media_url
from saavn_nn import get_album_details
from saavn_nn import get_album_details_from_url
from saavn_nn import get_lyrics
from saavn_nn import get_playlist_details
from saavn_nn import get_playlist_details_from_url
from saavn_nn import get_song_details
from saavn_nn import get_song_details_from_url
from saavn_nn import search_query

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

task_manager = TaskManager()


@app.get('/')
def home():
    return RedirectResponse(url = '/docs')


@app.get('/search')
def search_jiosaavn(query: str, lyrics: Optional[bool] = False):
    """
    Submit your query here.
    Valid query options are - song/album/playlist link of from https://www.jiosaavn.com/
    or text query
    """
    if 'saavn' in query:
        token = query.split('/')[-1]
        if '/song' in query:
            return {"type": "song", "result": get_song_details_from_url(token)}
        elif '/album' in query:
            return {
                "type": "album",
                "result": get_album_details_from_url(token)
            }
        elif '/playlist' in query or '/featured' in query:
            return {
                "type": "playlist",
                "result": get_playlist_details_from_url(token, 1)
            }
        else:
            return JSONResponse(status_code = 404, content = {
                "error": "Unknown URL",
                "error code": 1001,
                "url": query,
                "message": "Please send links from https://www.jiosaavn.com only"
            })
    return {"type": "query", "result": search_query(query)}


@app.get('/song/{song_id}')
def song_details(song_id: str) -> SongDetails:
    """Get song details using song id,
    which may be obtained from previous query results"""
    return get_song_details(song_id)


@app.get('/lyrics/{song_id}')
def get_song_lyrics_(song_id: str):
    """Get song lyrics"""
    return get_lyrics(song_id)


@app.get('/album/{album_id}')
def album_details(album_id: str) -> AlbumDetails:
    """Get album details including details of all songs in the album by using
    album id, which may be obtained from previous query results"""
    return get_album_details(album_id)


@app.get('/playlist/{playlist_id}')
def playlist_details(playlist_id: str,
                     page_no: Optional[int] = 1) -> PlaylistDetails:
    """Get playlist details with top 5 songs in the playlist by using
    album id, which may be obtained from previous query results"""
    return get_playlist_details(playlist_id, page_no)


@app.get('/media_url/{song_id}')
def download_link(song_id: str) -> str:
    """Get verified download link of the song using song_id"""
    return check_media_url(get_song_details(song_id).media_url)


@app.get('/download_song/{song_id}')
def download_song(song_id: str):
    song_details = get_song_details(song_id)
    media_url = song_details.media_url
    return {"task_id": task_manager.add_task(media_url)}


@app.get('/get_task_status/{task_id}')
def get_task_status(task_id: int):
    print("getting task status", task_id)
    return {"task_finished": task_manager.get_task_status(task_id)}


@app.get('/del_task/{task_id}')
def del_task(task_id: int):
    print("deleting task status", task_id)
    task_manager.del_task(task_id)
    return {"task_finished": True}


# ---------------------------------------------------------------------------
# Dedicated SoundWave Downloads Endpoints
# ---------------------------------------------------------------------------
import os
import re
import subprocess
import requests
from pydantic import BaseModel

DOWNLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "SoundWave Downloads"))
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

class SaveDownloadRequest(BaseModel):
    track_id: str
    title: str
    artist: str
    audio_url: str

def sanitize_filename(name: str) -> str:
    cleaned = re.sub(r'[\\/*?:"<>|]', "", name).strip()
    return cleaned if cleaned else "track"

@app.post('/api/save_download')
def save_download_to_folder(req: SaveDownloadRequest):
    """
    Downloads the audio stream and saves it into the dedicated SoundWave Downloads folder on disk.
    """
    try:
        clean_title = sanitize_filename(req.title)
        clean_artist = sanitize_filename(req.artist)
        
        # Determine extension from url or default to .mp4
        url_lower = req.audio_url.lower()
        if '.mp3' in url_lower:
            ext = '.mp3'
        elif '.m4a' in url_lower:
            ext = '.m4a'
        elif '.aac' in url_lower:
            ext = '.aac'
        else:
            ext = '.mp4'
            
        filename = f"{clean_artist} - {clean_title}{ext}"
        filepath = os.path.join(DOWNLOADS_DIR, filename)

        # Download if file doesn't already exist or has 0 bytes
        if not os.path.exists(filepath) or os.path.getsize(filepath) == 0:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            resp = requests.get(req.audio_url, headers=headers, stream=True, timeout=45)
            if resp.status_code == 200:
                with open(filepath, 'wb') as f:
                    for chunk in resp.iter_content(chunk_size=32768):
                        if chunk:
                            f.write(chunk)
            else:
                return JSONResponse(status_code=400, content={"error": f"Failed to download audio: status {resp.status_code}"})

        file_size = os.path.getsize(filepath)
        return {
            "success": True,
            "filename": filename,
            "filepath": filepath,
            "file_size": file_size,
            "folder": DOWNLOADS_DIR
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get('/api/open_downloads_folder')
def open_downloads_folder():
    """
    Opens the SoundWave Downloads folder directly in the system file explorer.
    """
    try:
        os.makedirs(DOWNLOADS_DIR, exist_ok=True)
        if os.name == 'nt':
            os.startfile(DOWNLOADS_DIR)
        else:
            subprocess.Popen(['xdg-open', DOWNLOADS_DIR])
        return {"success": True, "folder": DOWNLOADS_DIR}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get('/api/list_downloads_folder')
def list_downloads_folder():
    """
    Returns the list of audio files inside the SoundWave Downloads folder.
    """
    files = []
    if os.path.exists(DOWNLOADS_DIR):
        for f in os.listdir(DOWNLOADS_DIR):
            fpath = os.path.join(DOWNLOADS_DIR, f)
            if os.path.isfile(fpath):
                files.append({
                    "filename": f,
                    "filepath": fpath,
                    "size": os.path.getsize(fpath),
                    "modified": os.path.getmtime(fpath)
                })
    return {"folder": DOWNLOADS_DIR, "files": files}

@app.api_route('/api/stream_proxy', methods=['GET', 'HEAD'])
def stream_proxy(url: str, request: Request):
    """
    Proxies audio streams so the browser can play them reliably even if local DNS or adblockers block aac.saavncdn.com.
    """
    if not url or not url.startswith('http'):
        return JSONResponse(status_code=400, content={"error": "Invalid audio URL"})

    try:
        req_headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        range_header = request.headers.get('range')
        if range_header:
            req_headers['Range'] = range_header

        req = requests.get(url, headers=req_headers, stream=True, timeout=25)
        
        def iterfile():
            for chunk in req.iter_content(chunk_size=65536):
                if chunk:
                    yield chunk

        content_type = req.headers.get('content-type', 'audio/mp4')
        resp_headers = {
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*",
        }
        if "Content-Length" in req.headers:
            resp_headers["Content-Length"] = req.headers["Content-Length"]
        if "Content-Range" in req.headers:
            resp_headers["Content-Range"] = req.headers["Content-Range"]

        return StreamingResponse(
            iterfile(),
            status_code=req.status_code,
            media_type=content_type,
            headers=resp_headers
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


if __name__ == '__main__':
    from os import environ
    from uvicorn import run

    run("app:app", host = "0.0.0.0", port = int(environ.get("PORT", 5000)))
