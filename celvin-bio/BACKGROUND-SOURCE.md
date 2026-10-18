# Selected background

The owner requested this specific Pinterest video as the profile background:
https://de.pinterest.com/pin/1111685489282313182/

The public pin provided this downloadable MP4:
https://v1.pinimg.com/videos/iht/expMp4/06/99/0e/06990e6161d16ba6d150294ab0db6dbe_720w.mp4

The file is stored at `public/profile/pinterest-background.mp4` and served directly
by Express. It is not transcoded, interpolated or upscaled. The decoded MP4 is 736×414 pixels at 30 fps and approximately 10.3 seconds.
The public HLS playlist also lists 736×414 as its largest rendition. It is not a
native 4K/120fps source. The original website soundtrack is independent; background
playback stays muted, looping and inline.

The one-time setup keeps a prior settings snapshot and leaves later Admin changes
intact. This note records the selected source.
