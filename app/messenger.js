import * as msg from 'messaging';

export function Messenger(apiToken) {
  if (apiToken !== undefined) {
    this.apiToken = apiToken;
  } else {
    throw 'No ApiToken Configured';
  }
}

Messenger.prototype.loadProjects = function () {
  if (isSocketReady()) {
    msg.peerSocket.send({
      command: 'loadAllProjects',
      apiToken: this.apiToken,
    });
  }
};
Messenger.prototype.loadProjectById = function (projectId, projectName) {
  if (isSocketReady()) {
    msg.peerSocket.send({
      command: 'loadTasksForProjectId',
      id: projectId,
      projectName,
      apiToken: this.apiToken,
    });
  }
};

Messenger.prototype.closeTasksById = function (taskIds) {
  if (isSocketReady()) {
    msg.peerSocket.send({
      command: 'closeTasks',
      ids: taskIds,
      apiToken: this.apiToken,
    });
  }
};

const isSocketReady = () => msg.peerSocket.readyState === msg.peerSocket.OPEN;
