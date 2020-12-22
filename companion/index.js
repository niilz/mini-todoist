import { me } from "companion";
import { token } from "../resources/todoist-token";

let options = {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token.todoist_token}`,
    "Content-Type": "application/json",
  },
};
fetch("https://api.todoist.com/rest/v1/projects", options)
  .then((res) => res.json())
  .then((json) => console.log("got json", json));
