import document from 'document';
import * as msg from 'messaging';
import { me as appbit } from 'appbit';
import { Messenger } from '../app/messenger';
import { Navigator } from '../app/navigator';
import { Settings } from '../app/settings';
import {TASK_COMPLETED_COLOR, TASK_COLOR} from '../resources/constants';

const projectList = document.getElementById('project-list');
const taskList = document.getElementById('task-list');
const projectsScreen = document.getElementById('projects-screen');
const tasksScreen = document.getElementById('tasks-screen');
const saveScreen = document.getElementById('save-screen');
const noTokenScreen = document.getElementById('no-token-screen');
const noInternetScreen = document.getElementById('no-internet-screen');

let completedTaskIds = [];
let tasksToDisplay = [];

const messenger;
const navigator = new Navigator(projectsScreen);
const settings = new Settings();

if (!appbit.permissions.granted('access_internet')) {
  navigator.navigateTo(noInternetScreen);
}

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
      taskList.length = tasksToDisplay.length;
    } else {
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
    // Mark task as completed
    textEl.style.fill = TASK_COMPLETED_COLOR;
    completedTaskIds.push(task.id);
  } else {
    // Mark task as uncompleted
    textEl.style.fill = TASK_COLOR;
    completedTaskIds = completedTaskIds.filter(id => id !== task.id);
  }
  task.active = !task.active;
};

document.getElementById('yes').onclick = () => {
  navigator.navigateTo(projectsScreen);
  tasksToDisplay = [];
  taskBuffer = [];
  messenger.closeTasksById(completedTaskIds);
  completedTaskIds = [];
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
        bgStyles: element.bgStyles,
        bgProps: element.bgProps,
      };
    },
    configureTile: (tile, item) => {

      const textEl = tile.getElementById('text');
      configureTileStyles(textEl, tile, item);

      const touch = tile.getElementById('touchable');

      if (item.id === 'done-button') {
        touch.onclick = _e => {
          if (completedTaskIds.length > 0) {
            navigator.navigateTo(saveScreen);
          } else {
            navigator.navigateTo(projectsScreen);
            tasksToDisplay = [];
            taskBuffer = [];
          }
        };
      } else if (item.id !== 'header') {
        touch.onclick = _e => action(textEl, item);
      }
    },
  };
}

function configureTileStyles(textEl, tile, item) {
  textEl.text = item.name;
  Object.keys(item.styles).forEach(
    styleProp => (textEl.style[styleProp] = item.styles[styleProp])
  );
  Object.keys(item.props).forEach(
    prop => (textEl[prop] = item.props[prop])
  );
  const bg = tile.getElementsByClassName('bg')[0];
  Object.keys(item.bgStyles).forEach(
    bgStyle =>
      bg.style[bgStyle] = item.bgStyles[bgStyle]
  );
  Object.keys(item.bgProps).forEach(
    bgProp => bg[bgProp] = item.bgProps[bgProp]
  );

}
