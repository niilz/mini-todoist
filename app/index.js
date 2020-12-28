import document from 'document';
import * as msg from 'messaging';

const projectList = document.getElementById('project-list');
const itemList = document.getElementById('item-list');
const projectsScreen = document.getElementsByClassName('projects-screen')[0];
const itemsSrceen = document.getElementsByClassName('items-screen')[0];

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

function loadProjects() {
  if (msg.peerSocket.readyState === msg.peerSocket.OPEN) {
    msg.peerSocket.send({ command: 'loadAllProjects' });
  }
}

msg.peerSocket.onerror = e =>
  console.log(`APP: Connection-Error: ${e.code} - ${e.message}`);

const projectItemOnClickHandler = (textEl, item) => {
  loadProjectById(item.id);
  // Navigate to items-screen
  projectsScreen.style.display = 'none';
  itemsSrceen.style.display = 'inline';
};

const listItemOnClickHandler = (textEl, item) => {
  textEl.style.fill = item.active ? 'red' : 'grey';
  item.active = !item.active;
  // Navigate to projects-screen
  itemsSrceen.style.display = 'none';
  projectsScreen.style.display = 'inline';
};

function configureDelegate(type, elements, action) {
  return {
    getTileInfo: idx => {
      const element = elements[idx];
      return {
        type: type,
        index: idx,
        id: element.id,
        name: element.name,
        active: true,
      };
    },
    configureTile: (tile, item) => {
      if (item.type === type) {
        const textEl = tile.getElementById('text');
        textEl.text = item.name;
        const touch = tile.getElementById('touchable');
        touch.onclick = _e => action(textEl, item);
      }
    },
  };
}

function loadProjectById(projectId) {
  if (msg.peerSocket.readyState === msg.peerSocket.OPEN) {
    msg.peerSocket.send({ command: 'loadProjectListById', id: projectId });
  }
}
