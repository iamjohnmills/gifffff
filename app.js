class App {
  constructor(options){
    this.image = document.createElement('img');
    this.collections_index = 0;
    this.collections = options.collections;
    this.filters = options.filters;
    this.images_index = 0;
    this.loading = false;
    this.interval = null;
    this.autoplay = true;
    this.root = document.getElementById(options.root);
    this.cursor = {
      el: document.createElement('div'),
      x: null,
      y: null,
      direction: 'right',
      w_height: window.innerHeight,
      w_width: window.innerWidth,
    }
    this.keys_allowed = ['ArrowUp','ArrowDown','ArrowRight','ArrowLeft','Space'];
    document.addEventListener('DOMContentLoaded',this.start);
    window.addEventListener('resize', this.resize);
    document.addEventListener('click',this.click);
    document.addEventListener('mousemove',this.mousemove);
    document.addEventListener('keyup',this.keyup);
  }
  click = async (event) => {
    if(this.cursor.direction == 'up'){
      await this.nextCollection();
    } else if(this.cursor.direction == 'down') {
      await this.previousCollection();
    } else if(this.cursor.direction == 'right') {
      if(this.autoplay) await this.autoPlay();
      await this.nextImage();
    } else if(this.cursor.direction == 'left') {
      if(this.autoplay) await this.autoPlay();
      await this.previousImage();
    }
  }
  resize = async (event) => {
    this.root.classList.remove(...this.root.classList);
    this.cursor.w_height = window.innerHeight;
    this.cursor.w_width = window.innerWidth;
  }
  mousemove = async (event) => {
    this.cursor.x = event.offsetX;
    this.cursor.y = event.offsetY;
    this.root.classList.remove(...this.root.classList);
    if(this.cursor.y >= this.cursor.w_height / 2){
      this.root.classList.add('cursor-down');
      this.cursor.direction = 'down';
    } else if(this.cursor.y < this.cursor.w_height / 2){
      this.root.classList.add('cursor-up');
      this.cursor.direction = 'up';
    }
    if(this.cursor.x >= this.cursor.w_width / 2 && this.cursor.y > 100 && this.cursor.y < this.cursor.w_height - 100){
      this.root.classList.add('cursor-right');
      this.cursor.direction = 'right';
    } else if(this.cursor.x < this.cursor.w_width / 2 && this.cursor.y > 100 && this.cursor.y < this.cursor.w_height - 100){
      this.root.classList.add('cursor-left');
      this.cursor.direction = 'left';
    }
  }
  keyup = async (event) => {
    if(!this.keys_allowed.includes(event.code) || this.loading) return;
    if(event.code == 'Space'){
      await this.autoPlay();
    } else if(event.code == 'ArrowUp'){
      //if(this.autoplay) await this.autoPlay();
      await this.nextCollection();
    } else if(event.code == 'ArrowDown'){
      //if(this.autoplay) await this.autoPlay();
      await this.previousCollection();
    } else if(event.code == 'ArrowRight'){
      if(this.autoplay) await this.autoPlay();
      await this.nextImage();
    } else if(event.code == 'ArrowLeft'){
      if(this.autoplay) await this.autoPlay();
      await this.previousImage();
    }
  }
  autoPlay = () => {
    if(this.autoplay){
      this.autoplay = false;
      clearTimeout(this.interval);
    } else {
      this.autoplay = true;
      this.nextImage();
    }
  }
  getNextIndex = (length,current,backward=false) => {
    let start = 0;
    let end = length - 1;
    let next = current + 1;
    let prev = current - 1;
    if(!backward && next > end) return start;
    if(backward && prev < start) return end;
    if(!backward) return next;
    if(backward) return prev;
  }
  nextCollection = async () => {
    this.collections_index = await this.getNextIndex(this.collections.length, this.collections_index);
    this.images_index = 0;
    this.loop();
  }
  previousCollection = async () => {
    this.collections_index = await this.getNextIndex(this.collections.length, this.collections_index, true);
    this.images_index = 0;
    this.loop();
  }
  nextImage = async () => {
    this.images_index = await this.getNextIndex(this.collections[this.collections_index].images.length, this.images_index);
    this.loop();
  }
  previousImage = async () => {
    this.images_index = await this.getNextIndex(this.collections[this.collections_index].images.length, this.images_index, true);
    this.loop();
  }
  build = async () => {
    // add the image
    this.root.appendChild(this.image);
    // add the noise overlay to display when loading images
    this.loading_el = document.createElement('div');
    this.loading_el.classList.add('filter');
    this.loading_el.classList.add('hide');
    this.loading_el.style['background-image'] = 'url(noise.gif)';
    this.loading_el.style['background-size'] = 'cover';
    this.loading_el.style['mix-blend-mode'] = 'hard-light';
    this.loading_el.style['opacity'] = '1';
    await this.root.appendChild(this.loading_el);
    // add the fitler overlays
    for(var i in this.filters){
      let filter = this.filters[i];
      let filter_el = document.createElement('div');
      filter_el.classList.add('filter');
      filter_el.style['background-image'] = 'url(' + filter.image + ')';
      filter_el.style['background-size'] = filter.size;
      filter_el.style['mix-blend-mode'] = filter.blend;
      filter_el.style['opacity'] = filter.opacity;
      await this.root.appendChild(filter_el);
    }
  }
  loadImage = src => {
    return new Promise( (resolve,reject) => {
      this.image.src = src;
      this.image.onload = resolve;
      this.image.onerror = reject;
    })
  }
  loop = async () => {
    clearTimeout(this.interval);
    this.loading = true;
    this.loading_el.classList.remove('hide');
    let image = this.collections[this.collections_index].images[this.images_index];
    await this.loadImage(image.url).then(() => {
      this.loading = false;
      this.loading_el.classList.add('hide');
      if(this.autoplay){
        this.images_index = this.getNextIndex(this.collections[this.collections_index].images.length,this.images_index);
        this.interval = setTimeout(this.loop,image.duration);
      }
    }).catch(error => {
      this.loading = false;
      this.loading_el.classList.add('hide');
      this.images_index = this.getNextIndex(this.collections[this.collections_index].images.length,this.images_index);
      this.loop();
    });
  }
  start = async () => {
    await this.build();
    this.loop();
  }
}
