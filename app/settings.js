import * as fs from 'fs';

export function Settings() {
  this.TOKEN_FILE = 'apiToken.cbor';
  this.TOKEN_FILE_TYPE = 'cbor';
}

// Can throw if file is not there
Settings.prototype.getApiToken = function () {
  if (this.apiToken === undefined) {
    this.apiToken = this._loadToken();
  }
  return this.apiToken;
};

Settings.prototype.setApiToken = function (token) {
  this.apiToken = token;
  this._saveApiToken(this.apiToken);
};

Settings.prototype._loadToken = function () {
  fs.readFileSync(this.TOKEN_FILE, TOKEN_FILE_TYPE);
};

Settings.prototype._saveApiToken = function () {
  fs.writeFileSync(this.TOKEN_FILE, this.apiToken, this.TOKEN_FILE_TYPE);
};
