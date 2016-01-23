define(['three.min'], function(THREE) {
    THREEWindow = function (width, height, scene, camera) {
        this.scene = scene;
        this.camera = camera;

        this.renderer = new THREE.WebGLRenderer();
        
        if (width && height) {
            this.width = width;
            this.height = height;
            this.renderer.setSize(width, height);
            this.fullscreen = false;
        } else {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.fullscreen = true;
        }
        
        this.renderer.domElement.style.display = "block";
        document.body.style.margin = "0";

        document.body.appendChild(this.renderer.domElement);
    }

    THREEWindow.prototype.render = function () {
        if (this.scene && this.camera) this.renderer.render(this.scene, this.camera);
    };

    THREEWindow.prototype.resize = function (screenwidth, screenheight) {
        if (!this.fullscreen) return;

        this.renderer.setSize(screenwidth, screenheight);
        if (this.camera) {
            this.camera.aspect = screenwidth/screenheight;
            this.camera.updateProjectionMatrix();
        }
    };

    return THREEWindow;
});
