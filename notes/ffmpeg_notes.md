to convert a series of pngs to an h.264/mp4 with pixel format yuv420:

```shell
ffmpeg -r 30 -i frames/f%04d.png -c:v libx264 -pix_fmt yuv420p -s:v 1000x1000 output.mp4
```

references:
- https://github.com/nannou-org/nannou/issues/187#issuecomment-411036727
- https://superuser.com/questions/533695/how-can-i-convert-a-series-of-png-images-to-a-video-for-youtube
- https://hamelot.io/visualization/using-ffmpeg-to-convert-a-set-of-images-into-a-video/

