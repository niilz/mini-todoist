const BASE_URL = 'https://api.todoist.com/rest/v1';
const options = (method, token) => {
  return {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

export function fetchProjects(apiToken) {
  return fetch(`${BASE_URL}/projects`, options('GET', apiToken))
    .then(res => res.json())
    .catch(e => console.log(`Could not get projects ${e}`));
}

export function fetchTasksByProjectId(apiToken, id) {
  return fetch(`${BASE_URL}/tasks?project_id=${id}`, options('GET', apiToken))
    .then(res => res.json())
    .catch(e => console.log(`Could not get tasks for project-id ${id} ${e}`));
}

export function closeTaskById(apiToken, id) {
  return fetch(
    `${BASE_URL}/tasks/${id}/close`,
    options('POST', apiToken)
  ).catch(e => console.log(`Could not close task with id ${id} ${e}`));
}
