import document from 'document';
import * as msg from 'messaging';

const projectList = document.getElementById('project-list');
const itemList = document.getElementById('item-list');
const projectsScreen = document.getElementById('projects-screen');
const itemsSrceen = document.getElementById('items-screen');
const saveScreen = document.getElementById('save-screen');
const ANIMATION_TIME = 200;

msg.peerSocket.onopen = () => loadProjects();

msg.peerSocket.onmessage = evt => {
  if (!evt.data) {
    return;
  }
  if (evt.data.listType === 'project-list') {
    projectList.delegate = configureDelegate(
      'project-pool',
      evt.data.projects,
      projectItemOnClickHandler
    );
    projectList.length = evt.data.projects.length;
  }
  if (evt.data.listType === 'item-list') {
    itemList.delegate = configureDelegate(
      'item-pool',
      evt.data.items,
      listItemOnClickHandler
    );
    itemList.length = evt.data.items.length;
  }
};

msg.peerSocket.onerror = e =>
  console.log(`APP: Connection-Error: ${e.code} - ${e.message}`);

const projectItemOnClickHandler = (textEl, item) => {
  loadProjectById(item.id, item.name);
  navigateFromTo(projectsScreen, itemsSrceen);
};

const listItemOnClickHandler = (textEl, item) => {
  textEl.style.fill = item.active ? 'red' : 'grey';
  item.active = !item.active;
};

document.getElementById('yes').onclick = () =>
  navigateFromTo(saveScreen, projectsScreen);
document.getElementById('no').onclick = () =>
  navigateFromTo(saveScreen, itemsSrceen);

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
      if (item.id === 'back-button') {
        touch.onclick = _e => {
          navigateFromTo(itemsSrceen, saveScreen);
        };
      } else if (item.id !== 'header') {
        touch.onclick = _e => action(textEl, item);
      }
    },
  };
}

function loadProjects() {
  if (msg.peerSocket.readyState === msg.peerSocket.OPEN) {
    msg.peerSocket.send({ command: 'loadAllProjects' });
  }
}

function loadProjectById(projectId, projectName) {
  if (msg.peerSocket.readyState === msg.peerSocket.OPEN) {
    msg.peerSocket.send({
      command: 'loadProjectListById',
      id: projectId,
      projectName,
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
