workflow "New workflow" {
  on = "push"
  resolves = ["test"]
}

action "install-deps" {
  uses = "actions/npm@c555744"
  args = "install"
}

action "test" {
  uses = "actions/npm@c555744"
  args = "test"
  needs = ["install-deps"]
}
