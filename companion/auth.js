import { me as companion } from 'companion';
import { settingsStorage } from 'settings';
import { me as companion } from 'companion';

const KEY_API_TOKEN = 'api-token';
let apiToken;
const setApiToken = token => {
  console.log('Setting token');
  apiToken = token;
  if (isSocketReady()) {
    _fetchProjects(token);
  }
  console.log('stored in Settings', settingsStorage.getItem(KEY_API_TOKEN));
};
settingsStorage.onchange = e => {
  console.log('Settings changed', e.key, JSON.parse(e.newValue).name);
  if (e.key === KEY_API_TOKEN) {
    setApiToken(JSON.parse(e.newValue).name);
  }
};
if (companion.launchReasons.settingsChanged) {
  console.log(
    'Settings changed while offline',
    settingsStorage.getItem(KEY_API_TOKEN)
  );
  setApiToken(settingsStorage.getItem(KEY_API_TOKEN));
}
