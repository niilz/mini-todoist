const ANIMATION_TIME = 200;

export function Navigator(start) {
  this.start = start;
}

Navigator.prototype.navigateTo = function (destination) {
  if (this.start === destination) return;

  this.start.animate('disable');
  setTimeout(() => {
    destination.animate('enable');
    destination.style.display = 'inline';
    this.start.style.display = 'none';
    this.start = destination;
  }, ANIMATION_TIME);
};
