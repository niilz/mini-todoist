import document from 'document';
import * as msg from 'messaging';
import { Messenger } from '../app/messenger';
import { Navigator } from '../app/navigator';
import { Settings } from '../app/settings';

const projectList = document.getElementById('project-list');
const taskList = document.getElementById('task-list');
const projectsScreen = document.getElementById('projects-screen');
const tasksScreen = document.getElementById('tasks-screen');
const saveScreen = document.getElementById('save-screen');
const noTokenScreen = document.getElementById('no-token-screen');

let completedTaskIds = [];
let tasksToDisplay = [];

const messenger;
const navigator = new Navigator(projectsScreen);
const settings = new Settings();

msg.peerSocket.onopen = () => {
  try {
    const apiToken = settings.getApiToken();
    messenger = new Messenger(apiToken);
    messenger.loadProjects();
  } catch (ex) {
    navigator.navigateTo(noTokenScreen);
  }
};

let taskBuffer = [];
msg.peerSocket.onmessage = evt => {
  if (!evt || !evt.data) return;

  if (evt.data.command === 'updateToken') {
    settings.setApiToken(evt.data.token);
    if (messenger === undefined) {
      messenger = new Messenger(evt.data.token);
    }
    messenger.loadProjects();
    navigator.navigateTo(projectsScreen);
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
    if (evt.data.done) {
      tasksToDisplay = taskBuffer.concat(evt.data.tasks);
      taskList.delegate = configureDelegate(
        'task-pool',
        tasksToDisplay,
        taskOnClickHandler
      );
      console.log(`setting tasksToDisplay. length: ${tasksToDisplay.length}`)
      taskList.length = tasksToDisplay.length;
    } else {
      console.log(`setting tasksToDisplay. length: ${tasksToDisplay.length}`)
      taskBuffer = taskBuffer.concat(evt.data.tasks);
    }
  }
};

msg.peerSocket.onerror = e =>
  console.log(`APP: Connection-Error: ${e.code} - ${e.message}`);

const projectOnClickHandler = (_textEl, project) => {
  messenger.loadProjectById(project.id, project.name);
  navigator.navigateTo(tasksScreen);
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
  navigator.navigateTo(projectsScreen);
  console.log(`setting tasksToDisplay. length: ${tasksToDisplay.length}`)
  tasksToDisplay = [];
  taskBuffer = [];
  console.log(`setting tasksToDisplay. length: ${tasksToDisplay.length}`)
  messenger.closeTasksById(completedTaskIds);
};
document.getElementById('no').onclick = () =>
  navigator.navigateTo(tasksScreen);


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
          navigator.navigateTo(saveScreen);
        };
      } else if (item.id !== 'header') {
        touch.onclick = _e => action(textEl, item);
      }
    },
  };
}
