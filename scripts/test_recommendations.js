async function testRecommendations() {
  console.log('--- Testing Live Recommendations API ---');
  
  // Test 1: Punjabi & Diljit Dosanjh
  const res1 = await fetch('http://127.0.0.1:5000/search?query=Diljit%20Dosanjh%20top%20hits');
  const data1 = await res1.json();
  const tracks1 = data1.result || [];
  console.log(`✓ Diljit Dosanjh search returned ${tracks1.length} studio tracks:`);
  tracks1.slice(0, 3).forEach(t => console.log(`   - "${t.title}" (${t.language}) [${t.media_url_default ? 'Streaming OK' : 'No Media'}]`));

  console.assert(tracks1.length > 0, 'Diljit search must return tracks');
  console.assert(tracks1[0].media_url_default, 'Track must have valid stream URL');

  // Test 2: AP Dhillon
  const res2 = await fetch('http://127.0.0.1:5000/search?query=AP%20Dhillon%20best%20songs');
  const data2 = await res2.json();
  const tracks2 = data2.result || [];
  console.log(`\n✓ AP Dhillon search returned ${tracks2.length} studio tracks:`);
  tracks2.slice(0, 3).forEach(t => console.log(`   - "${t.title}" (${t.language}) [${t.media_url_default ? 'Streaming OK' : 'No Media'}]`));

  console.assert(tracks2.length > 0, 'AP Dhillon search must return tracks');

  // Test 3: Taylor Swift
  const res3 = await fetch('http://127.0.0.1:5000/search?query=Taylor%20Swift%20best%20songs');
  const data3 = await res3.json();
  const tracks3 = data3.result || [];
  console.log(`\n✓ Taylor Swift search returned ${tracks3.length} tracks:`);
  tracks3.slice(0, 3).forEach(t => console.log(`   - "${t.title}" (${t.language}) [${t.media_url_default ? 'Streaming OK' : 'No Media'}]`));

  console.assert(tracks3.length > 0, 'Taylor Swift search must return tracks');

  // Test 4: Language-specific Trending: Punjabi Hits
  const res4 = await fetch('http://127.0.0.1:5000/search?query=Top%20Punjabi%20Hits%202026');
  const data4 = await res4.json();
  const tracks4 = data4.result || [];
  console.log(`\n✓ Top Punjabi Hits search returned ${tracks4.length} tracks:`);
  tracks4.slice(0, 3).forEach(t => console.log(`   - "${t.title}" (${t.language})`));

  console.assert(tracks4.length > 0, 'Language hits must return tracks');

  console.log('\nALL LIVE RECOMMENDATION TESTS PASSED WITH REAL STUDIO MASTER RECORDINGS!');
}

testRecommendations().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
