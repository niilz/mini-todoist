import document from 'document';
import * as msg from 'messaging';

const projectList = document.getElementById('project-list');
const itemList = document.getElementById('item-list');
const projectsScreen = document.getElementById('projects-screen');
const itemsSrceen = document.getElementById('items-screen');

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
  loadProjectById(item.id, item.name);
  // Navigate to items-screen
  projectsScreen.style.display = 'none';
  itemsSrceen.style.display = 'inline';
};

const listItemOnClickHandler = (textEl, item) => {
  textEl.style.fill = item.active ? 'red' : 'grey';
  item.active = !item.active;
};

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
      if (item.id === 'footer') {
        touch.onclick = _e => {
          // Navigate to projects-screen
          itemsSrceen.style.display = 'none';
          projectsScreen.style.display = 'inline';
        };
      } else {
        touch.onclick = _e => action(textEl, item);
      }
    },
  };
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
