import { token } from '../resources/todoist-token';

const options = {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token.todoist_token}`,
    'Content-Type': 'application/json',
  },
};

export function fetchTodoistProjects() {
  return fetch('https://api.todoist.com/rest/v1/projects', options)
    .then(res => res.json())
    .catch(e => console.log(`Could not get projects ${e}`));
}

export function fetchTodoistProjectListById(id) {
  return fetch(
    `https://api.todoist.com/rest/v1/tasks?project_id=${id}`,
    options
  )
    .then(res => res.json())
    .catch(e => console.log(`Could not get projects for id ${id} ${e}`));
}
