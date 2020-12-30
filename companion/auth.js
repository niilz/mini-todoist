import { me as companion } from 'companion';
import { settingsStorage } from 'settings';
import * as msg from 'messaging';

const KEY_API_TOKEN = 'api-token';

export function initTokenSettings() {
  settingsStorage.onchange = e => {
    if (e.key === KEY_API_TOKEN) {
      setApiToken(e.newValue);
    }
  };
  if (companion.launchReasons.settingsChanged) {
    console.log(
      'Settings changed while offline',
      settingsStorage.getItem(KEY_API_TOKEN)
    );
    setApiToken(settingsStorage.getItem(KEY_API_TOKEN));
  }
}

const setApiToken = tokenAsJson => {
  const apiToken = JSON.parse(tokenAsJson).name;
  if (msg.peerSocket.readyState === msg.peerSocket.OPEN) {
    msg.peerSocket.send({ command: 'updateToken', token: apiToken });
  }
};
