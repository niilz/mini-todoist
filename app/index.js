import document from 'document';
import * as msg from 'messaging';

const projectList = document.getElementById('project-list');
const taskList = document.getElementById('task-list');
const projectsScreen = document.getElementById('projects-screen');
const tasksScreen = document.getElementById('tasks-screen');
const saveScreen = document.getElementById('save-screen');
const ANIMATION_TIME = 200;

let completedTaskIds = [];
let apiToken;

msg.peerSocket.onopen = () => {
  //TODO: check if token in File
  if (apiToken) loadProjects(apiToken);
};

msg.peerSocket.onmessage = evt => {
  if (!evt || !evt.data) return;

  if (evt.data.command === 'updateToken') {
    apiToken = evt.data.token;
    // TODO: store token in file
    loadProjects(apiToken);
  }
  if (evt.data.listType === 'project-list') {
    projectList.delegate = configureDelegate(
      'project-pool',
      evt.data.projects,
      projectOnClickHandler
    );
    projectList.length = evt.data.projects.length;
  }
  if (evt.data.listType === 'task-list') {
    taskList.delegate = configureDelegate(
      'task-pool',
      evt.data.tasks,
      taskOnClickHandler
    );
    taskList.length = evt.data.tasks.length;
  }
};

msg.peerSocket.onerror = e =>
  console.log(`APP: Connection-Error: ${e.code} - ${e.message}`);

const projectOnClickHandler = (_textEl, project) => {
  loadProjectById(project.id, project.name, apiToken);
  navigateFromTo(projectsScreen, tasksScreen);
};

const taskOnClickHandler = (textEl, task) => {
  if (task.active) {
    textEl.style.fill = 'grey';
    completedTaskIds.push(task.id);
  } else {
    textEl.style.fill = 'red';
    completedTaskIds = completedTaskIds.filter(id => id !== task.id);
  }
  task.active = !task.active;
};

document.getElementById('yes').onclick = () => {
  navigateFromTo(saveScreen, projectsScreen);
  closeTasksById(completedTaskIds, apiToken);
};
document.getElementById('no').onclick = () =>
  navigateFromTo(saveScreen, tasksScreen);

function configureDelegate(poolType, elements, action) {
  return {
    getTileInfo: idx => {
      const element = elements[idx];
      return {
        type: poolType,
        index: idx,
        id: element.id,
        name: element.name,
        active: true,
        styles: element.styles,
        props: element.props,
      };
    },
    configureTile: (tile, item) => {
      const textEl = tile.getElementById('text');
      textEl.text = item.name;
      const touch = tile.getElementById('touchable');
      Object.keys(item.styles).forEach(
        styleProp => (textEl.style[styleProp] = item.styles[styleProp])
      );
      Object.keys(item.props).forEach(
        prop => (textEl[prop] = item.props[prop])
      );
      if (item.id === 'save-button') {
        touch.onclick = _e => {
          navigateFromTo(tasksScreen, saveScreen);
        };
      } else if (item.id !== 'header') {
        touch.onclick = _e => action(textEl, item);
      }
    },
  };
}

const isSocketReady = () => msg.peerSocket.readyState === msg.peerSocket.OPEN;
function loadProjects(apiToken) {
  if (!apiToken) {
    console.info('No Api-Token. Not loading any projects');
    return;
  }
  if (isSocketReady()) {
    msg.peerSocket.send({ command: 'loadAllProjects', apiToken });
  }
}

function loadProjectById(projectId, projectName, apiToken) {
  if (isSocketReady()) {
    msg.peerSocket.send({
      command: 'loadTasksForProjectId',
      id: projectId,
      projectName,
      apiToken,
    });
  }
}

function closeTasksById(taskIds, apiToken) {
  if (isSocketReady()) {
    msg.peerSocket.send({
      command: 'closeTasks',
      ids: taskIds,
      apiToken,
    });
  }
}

function navigateFromTo(from, to) {
  from.animate('disable');
  setTimeout(() => {
    from.style.display = 'none';
    to.style.display = 'inline';
    to.animate('enable');
  }, ANIMATION_TIME);
}
