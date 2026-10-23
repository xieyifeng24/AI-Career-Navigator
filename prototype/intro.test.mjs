import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENES, INTRO_DURATION, INTRO_KEY, sceneAt, shouldPlayIntro, rememberIntro} from './intro.js';

function memory() {
  const data = new Map();
  return {getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value)};
}
test('six scenes span exactly 24 seconds and each boundary advances without gaps', () => {
  assert.equal(INTRO_DURATION, 24000);
  assert.deepEqual(SCENES.map(scene => scene.duration), [3500,4000,3500,4500,4500,4000]);
  let time = 0;
  SCENES.forEach((scene, index) => {
    assert.equal(sceneAt(time), index);
    assert.equal(sceneAt(time + scene.duration - 1), index);
    time += scene.duration;
  });
  assert.equal(sceneAt(24000), -1);
});
test('new visitor autoplays; ordinary return navigation does not replay', () => {
  const storage = memory();
  assert.equal(shouldPlayIntro(storage), true);
  rememberIntro(storage);
  assert.equal(storage.getItem(INTRO_KEY), 'seen');
  assert.equal(shouldPlayIntro(storage), false);
});
test('developer replay overrides seen marker; opt-out leaves marker unchanged', () => {
  const storage = memory();
  rememberIntro(storage);
  assert.equal(shouldPlayIntro(storage, '?intro=replay&keep=yes'), true);
  assert.equal(shouldPlayIntro(memory(), '?intro=off'), false);
  assert.equal(shouldPlayIntro(storage, '?intro=unrecognized'), false);
});
test('blocked or absent browser storage never prevents entry', () => {
  const blocked = {getItem(){throw new Error('denied');},setItem(){throw new Error('denied');}};
  assert.equal(shouldPlayIntro(blocked), true);
  assert.doesNotThrow(() => rememberIntro(blocked));
  assert.equal(shouldPlayIntro(null), true);
  assert.doesNotThrow(() => rememberIntro(null));
});
