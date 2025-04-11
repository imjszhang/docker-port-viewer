# Docker Port Viewer

Simple typescript application to view your currently running containers as well as setting a local hostname to reach them at. 

Relies on a docker-socket-proxy to get container information.

![image](https://github.com/user-attachments/assets/f495b66e-cfb4-4f7a-b43d-cebf536bd7ea)

## Local Build

Feel free to locally build the image for this yourself. Change the platform to whatever platform you plan on running the container off of. If it is your local system you can drop the --platform entirely as it will use your local but if you plan on running this on linux and are developing in MacOS you will need to sepcify. 

```
docker build --platform linux/amd64 -t docker-port-viewer:v1.0 .
```
