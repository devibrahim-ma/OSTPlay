const fs = require('fs');
const path = require('path');
const https = require('https');

const avatarsDir = path.join(__dirname, 'public', 'assets', 'avatars');

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const list = [
  { name: 'darth_vader.jpg', url: 'https://image.pollinations.ai/p/cyberpunk_darth_vader_neon_concept_art_square_profile_avatar_faded_background?width=150&height=150&seed=1' },
  { name: 'walter_white.jpg', url: 'https://image.pollinations.ai/p/cyberpunk_heisenberg_walter_white_neon_concept_art_square_profile_avatar_faded_background?width=150&height=150&seed=2' },
  { name: 'ironman.jpg', url: 'https://image.pollinations.ai/p/cyberpunk_ironman_neon_concept_art_square_profile_avatar_faded_background?width=150&height=150&seed=6' },
  { name: 'wednesday.jpg', url: 'https://image.pollinations.ai/p/cyberpunk_wednesday_addams_goth_neon_concept_art_square_profile_avatar_faded_background?width=150&height=150&seed=8' },
  { name: 'john_wick.jpg', url: 'https://image.pollinations.ai/p/cyberpunk_john_wick_neon_concept_art_square_profile_avatar_faded_background?width=150&height=150&seed=13' },
  { name: 'jack_sparrow.jpg', url: 'https://image.pollinations.ai/p/cyberpunk_jack_sparrow_pirate_neon_concept_art_square_profile_avatar_faded_background?width=150&height=150&seed=7' },
  { name: 'batman.jpg', url: 'https://image.pollinations.ai/p/cyberpunk_batman_neon_concept_art_square_profile_avatar_faded_background?width=150&height=150&seed=5' },
  { name: 'joker.jpg', url: 'https://image.pollinations.ai/p/cyberpunk_joker_neon_concept_art_square_profile_avatar_faded_background?width=150&height=150&seed=3' },
  { name: 'wolverine.jpg', url: 'https://image.pollinations.ai/p/cyberpunk_wolverine_logan_neon_concept_art_square_profile_avatar_faded_background?width=150&height=150&seed=14' },
  { name: 'spiderman.jpg', url: 'https://image.pollinations.ai/p/cyberpunk_spiderman_neon_concept_art_square_profile_avatar_faded_background?width=150&height=150&seed=4' },
  { name: 'totoro.jpg', url: 'https://image.pollinations.ai/p/cyberpunk_totoro_anime_concept_art_square_profile_avatar_faded_background?width=150&height=150&seed=9' },
  { name: 'goku.jpg', url: 'https://image.pollinations.ai/p/cyberpunk_goku_super_saiyan_neon_concept_art_square_profile_avatar_faded_background?width=150&height=150&seed=12' }
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function download(item) {
  return new Promise((resolve, reject) => {
    const dest = path.join(avatarsDir, item.name);
    const file = fs.createWriteStream(dest);

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    https.get(item.url, options, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${item.name}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${item.name}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  for (const item of list) {
    try {
      console.log(`Starting download for ${item.name}...`);
      await download(item);
      // Wait 3.5 seconds to avoid overloading the AI generator
      await sleep(3500);
    } catch (e) {
      console.error(`Error downloading ${item.name}:`, e.message);
    }
  }
  console.log("All done!");
}

main();
