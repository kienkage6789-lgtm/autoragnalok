const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const BASE_URL = 'https://ragnalok.online/human/assets/';
const DEST_DIR = path.join(__dirname, '..', 'public', 'assets');

// Helper to construct all paths
const files = [];

// 1. Summer tiles
const SPR_TREES = Array.from({length:15},(_,i)=>'tree_'+(i+1));
const SPR_STONE = Array.from({length:7 },(_,i)=>'stones_'+(i+1));
const SPR_GREEN = Array.from({length:10},(_,i)=>'greenery_'+(i+1));
const SPR_DECOR = Array.from({length:16},(_,i)=>'decor_'+(i+1));

['bg','river', ...SPR_TREES, ...SPR_STONE, ...SPR_GREEN, ...SPR_DECOR].forEach(n => {
  files.push(`tiles/summer/${n}.png`);
});

// 2. Monsters
for (let lv = 1; lv <= 9; lv++) files.push(`monsters/mon${lv}.png`);
['a_chick','a_piglet','a_lamb','a_rooster','a_turkey','a_calf','a_sheep','a_bull','slime1','slime2','slime3','slime4','slime5','slime6','plant1','plant2','plant3','golem1','golem2','golem3','mushroom1','mushroom2','mushroom3','rat1','rat2','rat3','lizard1','lizard2','lizard3','gnoll1','gnoll2','gnoll3','slimeboss1','slimeboss2','slimeboss3','vampire1','vampire2','vampire3','skeleton1','skeleton2','skeleton3','demon1','demon2','demon3'].forEach(n => {
  files.push(`monsters/${n}.png`);
});

// 3. Hero
['hero_pistol','hero_rifle','hero_mg','muzzle_pistol','muzzle_rifle','robot_idle','robot_walk','robot_attack','turret','cat_walk','cat_idle','dog_walk','dog_idle','priest_idle','priest_walk','priest_special','archer_idle','archer_walk','archer_attack','archer_attack_front','archer_attack_back','hero2_gun_idle','hero2_gun_walk','hero2_rifle_idle','hero2_rifle_walk','hero2_knife_idle','hero2_knife_walk','hero2_knife_atk','turret.png'].forEach(n => {
  if (n.endsWith('.png')) {
    files.push(`hero/${n}`);
  } else {
    files.push(`hero/${n}.png`);
  }
});

// 4. FX
['explode1','explode2','explode3','explode4','prop_money','prop_hp','prop_ammo','prop_armor'].forEach(n => {
  files.push(`fx/${n}.png`);
});

// 5. Archer
[['arc_idle','a_idle'],['arc_walk','a_walk'],['arc_run','a_run'],['arc_shot1','a_shot1'],['arc_shot2','a_shot2'],
 ['arc_melee','a_melee'],['arc_hurt','a_hurt'],['arc_dead','a_dead'],['arc_roll','a_roll'],['arc_elixir','a_elixir'],
 ['arc_arrow','a_arrow'],['fx_arrow_fire','fx_arrow_fire'],['fx_arrow_magic','fx_arrow_magic'],['fx_arrow_poison','fx_arrow_poison']].forEach(([k, f]) => {
  files.push(`hero/archer/${f}.png`);
});

// 6. Thrower
['th_idle','th_walk','th_run','th_attack','th_walk_atk','th_run_atk','th_hurt','th_death','fx_knife_s','fx_knife_b'].forEach(n => {
  files.push(`hero/thrower/${n}.png`);
});

// 7. Hero Skins
const HERO_SKIN_DEFS = ['sw2','sw3','sw4','sw5','sw6','sw7','sw8','sw9'];
const TH_STATES = ['idle','walk','run','attack','walk_atk','run_atk','hurt','death'];
HERO_SKIN_DEFS.forEach(hk => {
  TH_STATES.forEach(st => {
    files.push(`hero/thrower/skins/${hk}_${st}.png`);
  });
});

// 8. Titan Skins
const SKIN_DEFS = ['char2','char3','marty','jasmatha','ameoai','montana','destroyer','infantry','mecha1','mecha2','mecha3','swordsman','kowel','eyeflyer','turrus','dinosung','tarex'];
SKIN_DEFS.forEach(sk => {
  ['idle','walk','attack','prev'].forEach(kind => {
    files.push(`hero/skins/robot_${sk}_${kind}.png`);
  });
});

// 9. Pets
const PET_SKIN_DEFS = ['dog_black','cat_ginger','cat_navy','rat_brown','rat_navy','bird_blue','bird_teal','cat_cream','wolf_brown','rat_grey','cat_brown','wolf_black','hamster_cream','linhui'];
PET_SKIN_DEFS.forEach(pk => {
  ['walk','idle'].forEach(kind => {
    files.push(`hero/pets/pet_${pk}_${kind}.png`);
  });
});

// 10. Grassland
const _gl = ['ground_sheet', 'details_sheet'];
for (let i = 1; i <= 5;  i++) _gl.push('tree' + i, 'rock' + i, 'stone' + i, 'ruin' + i, 'ge' + i);
for (let i = 1; i <= 4;  i++) _gl.push('btree' + i);
for (let i = 1; i <= 19; i++) _gl.push('bush' + i);
for (let i = 1; i <= 11; i++) _gl.push('flower' + i);
for (let i = 1; i <= 3;  i++) _gl.push('gel' + i);
_gl.forEach(n => {
  files.push(`tiles/grassland/${n}.png`);
});

[['g_road_grass', 'road/Ground_grass.png'], ['g_road5', 'road/Road5.png'], ['g_bridge_h', 'bridge/bridge_h.png'], ['g_castle', 'castle/castle.png'], ['g_house_flag', 'castle/house_flag.png']].forEach(([k, f]) => {
  files.push(`tiles/grassland/${f}`);
});

// 11. Desert
['ds_palm','ds_palm2','ds_cactus1','ds_cactus2','ds_tree1','ds_tree2','ds_pyramid','ds_bones','ds_scull','ds_rock1','ds_rock2','ds_rock3','ds_dirt1','ds_dirt2','ds_dirt3','ds_pile1','ds_pile2','ds_grass1','ds_grass2','ds_flower1','oasis_tree',
 'ds_palm3','ds_palm4','ds_palm5','ds_palm_s','ds_palm_m','ds_tree_m','ds_bigtree','ds_bigtree2','ds_bush1','ds_yucca','ds_agave','ds_cactus3','ds_cactus4',
 'ds_oa_coast','ds_oa_rip3','ds_oa_lily1','ds_oa_lily2','ds_oa_lily3','ds_reed1','ds_reed2','ds_reed3'].forEach(n => {
  files.push(`tiles/desert/${n}.png`);
});

// 12. Winter
['wt_bigtree','wt_icetree1','wt_icetree2','wt_icetree3',
 'wt_tree2','wt_tree3','wt_tree6',
 'wt_crysflower1','wt_crysflower2','wt_crysflower3','wt_cryssharp1','wt_cryssharp2','wt_cryssharp3',
 'wt_mush1','wt_mush2','wt_mush3','wt_mush4','wt_mush5','wt_mush6','wt_idol1','wt_idol2','wt_ruin1','wt_ruin2','wt_ruin3','wt_ruin4',
 'wt_snowman1','wt_snowman2','wt_snowman3','wt_snowman4','wt_snowman5','wt_stone1','wt_stone2',
 'wt_iceflower1','wt_iceflower2','wt_iceflower3','wt_cube1','wt_cube2','wt_cube3','wt_cube4',
 'wt_ice','wt_ripple'].forEach(n => {
  files.push(`tiles/winter/${n}.png`);
});

// 13. GUI Icons
const ICO = [
  'Alchemy1_1.png', 'Item2_1.png', 'Bottle1_1.png', 'Bar10_1.png', 'Trinker2_1.png', 'Shield3_1.png', 'Sword2_1.png', 'Ring2_1.png', 'Ring5_1.png', 'Trinker7_1.png', 'Trinker6_1.png',
  'Helmet1_1.png', 'Helmet2_1.png', 'Helmet3_1.png', 'Helmet4_1.png', 'Helmet5_1.png', 'Helmet6_1.png',
  'Cuirass1_1.png', 'Cuirass2_1.png', 'Cuirass3_1.png', 'Cuirass5_1.png', 'Cuirass6_1.png',
  'Boots1_1.png', 'Boots2_1.png', 'Boots3_1.png', 'Boots4_1.png', 'Boots5_1.png',
  'Ring1_2.png', 'Ring3_1.png', 'Ring6_1.png',
  'Bottle3_1.png', 'Bottle4_1.png', 'Bottle2_1.png', 'Bottle5_1.png', 'Bottle10_1.png', 'Bottle1_1.png',
  'Bar10_1.png', 'Bar9_1.png', 'Bar6_1.png'
];
const uniqueIcos = [...new Set(ICO)];
uniqueIcos.forEach(f => {
  files.push(`icons/gui/${f}`);
});

console.log(`Total files to download: ${files.length}`);

// Downloader implementation
const CONCURRENCY = 15;
let index = 0;
let downloaded = 0;
let errors = 0;

function downloadFile(relPath) {
  return new Promise((resolve) => {
    const url = BASE_URL + relPath;
    const dest = path.join(DEST_DIR, relPath);
    
    // Create folders
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    
    const fileStream = fs.createWriteStream(dest);
    
    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        fileStream.close();
        fs.unlinkSync(dest); // Delete empty file
        console.error(`Failed to download ${relPath}: HTTP ${res.statusCode}`);
        errors++;
        resolve();
        return;
      }
      
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        downloaded++;
        const pct = Math.round((downloaded / files.length) * 100);
        console.log(`[${pct}%] Downloaded: ${relPath}`);
        resolve();
      });
    });
    
    req.on('error', (err) => {
      fileStream.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      console.error(`Error downloading ${relPath}: ${err.message}`);
      errors++;
      resolve();
    });
  });
}

async function worker() {
  while (index < files.length) {
    const currentIdx = index++;
    if (currentIdx >= files.length) break;
    await downloadFile(files[currentIdx]);
  }
}

async function start() {
  console.log('Starting assets download...');
  const promises = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    promises.push(worker());
  }
  await Promise.all(promises);
  console.log(`\nDownload finished. Successfully downloaded: ${downloaded}/${files.length} files. Errors: ${errors}`);
}

start();
