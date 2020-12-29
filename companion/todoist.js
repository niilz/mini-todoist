import { token } from '../resources/todoist-token';

const options = method => {
  return {
    method,
    headers: {
      Authorization: `Bearer ${token.todoist_token}`,
      'Content-Type': 'application/json',
    },
  };
};

export function fetchProjects() {
  return fetch('https://api.todoist.com/rest/v1/projects', options('GET'))
    .then(res => res.json())
    .catch(e => console.log(`Could not get projects ${e}`));
}

export function fetchTasksByProjectId(id) {
  return fetch(
    `https://api.todoist.com/rest/v1/tasks?project_id=${id}`,
    options('GET')
  )
    .then(res => res.json())
    .catch(e => console.log(`Could not get tasks for project-id ${id} ${e}`));
}

export function closeTaskById(id) {
  return fetch(
    `https://api.todoist.com/rest/v1/tasks/${id}/close`,
    options('POST')
  ).catch(e => console.log(`Could not close task with id ${id} ${e}`));
}
