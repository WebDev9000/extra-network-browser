# Extra Network Browser

![screenshot](screenshot.png)

Inspired by the Extra Network tabs in Automatic1111's WebUI, Extra Network Browser is a stand-alone take on the concept with additional features.

Easily choose a **LoRA, HyperNetwork, Embedding, Checkpoint, or Style** visually and copy the trigger, keywords, and suggested weight to the clipboard for easy pasting into the application of your choice.

Features of Extra Network Browser:

* Great for UI's like ComfyUI when used with nodes like [Lora Tag Loader](https://github.com/badjeff/comfyui_lora_tag_loader/) or [ComfyUI Prompt Control](https://github.com/asagi4/comfyui-prompt-control).
* Considerably fast, loads thousands of LoRA easily.
* A [Styles](#styles) tab that parses a styles CSV for thumbnail previews just like networks.
* [Keywords](#keywords) in the filename inside brackets [ ]'s are copied along with the LoRA trigger.
* [Weights](#weights) placed in braces { }'s *(eg {1.0} or {0.7-0.8})* in the filename are automatically set in the LoRA's trigger.
* Some characters not compatible with filenames are automatically converted from placeholders, such as ©️ to : *(for [keywords with weights](#weights))*
* Sort by Name, Date Modified, or try Random sort for inspiration.
* Support for multiple images per LoRA/model/etc in a [modal gallery](#modal) (including filename [search](#search)). Hover over a card & click the folder icon.
* Support for [displaying a companion .txt file](#modal) to store descriptions, notes, and prompts. Hover over a card & click the document icon.
* [Poses](#poses) tab to visually display OpenPose collections and examples.
* [Gallery](#modal) tab for arbitrary image folders, such as saved generation results.

<br />

## Installation / Setup

1) You must have [Node.JS](https://nodejs.org/en) 20.10.0 LTS or greater installed. *(I recommend the LTS.)*
2) clone (or download and unzip) this repo and cd into the newly created folder.<br />
   ```git clone https://github.com/WebDev9000/extra-network-browser.git && cd extra-network-browser```
4) Run `setup.bat` (once)

5) Run `start.bat`

<details>
<summary>Manual installation and start up</summary>

#### Setup:

```
git clone https://github.com/WebDev9000/extra-network-browser.git && cd extra-network-browser
cd api && npm install
cd ../app && npm install
```

#### Start up:

5) From api folder: `start node index` *(This starts the backend that'll deal with the filesystem)*
6) From app folder: `start npm run dev` *(The React frontend)*

*(Note: you can also use `npm run build` followed by `npm run preview`, or serve the dist folder with the webserver of your choice, such as nginx. This will give slightly better performance. If you do so, you must rerun `npm run build` after any new updates or changes to the code.)*

</details>
<br />

Then add content:

- Populate the folders in `api/networks/` with your files: `lora`, `checkpoints`, `embeddings`, `hypernets`, `styles`, `poses`, and `gallery`.
- Edit `api/networks/styles.csv` with *(only)* `name,prompt` on the first line, and your styles (following the format shown [below](#styles)) on the subsequent lines.

***OR***

1) `cd api/networks` and remove any folders you wish to symlink, and/or styles.csv if you wish to symlink it.
2) symlink your WebUI or other existing model folders to the following names: `lora`, `checkpoints`, `embeddings`, `hypernets`, `styles`
3) symlink your WebUI styles.csv to the root of the networks folder.

<details>
<summary>How to make symbolic links</summary>

Symlinking your existing folders is suggested and can be done as such:

``` bash
# Windows
mklink /d lora C:\webui\models\LoRA
# ... (other folders) ...
mklink styles.csv C:\webui\styles.csv

# Linux:
ln -s ~/webui/models/LoRA lora
# ... (other folders) ...
ln -s ~/webui/styles.csv styles.csv
```
</details>
<br />

<br />

## How to Use:

![menu](menu.png)

Filenames following the suggested naming convention are ***optional***, but to get the full convivence of the Extra Network Browser, the following format is suggested:

``` ini
name_v1_author [keyword1, keyword2] [keyword3, keyword4] (suggested model) {weight1-weight2}.safetensors
```

Or simply:
```
My-LoRA.safetensors
```

and a matching file of the same name ending in **.jpeg** (e.g. ```My-LoRA.jpeg```) in the same folder for the preview.  Max height is auto-sized to 336px, width is auto centered at a max 224px.

#### Additional Images
<a id="modal"></a>
*Option 1:*<br/>
Saving additional images as `My-LoRA. (1).jpeg`, `My-LoRA. (2).jpeg` and so on will populate a modal gallery popup.  You can then navigate to the prev / next network card with the left / right arrow keys while the modal is open.

To quickly rename a batch of images in this pattern in Windows, select multiple images, then rename them as `filename..jpeg` (two dots) -- windows will automatically add ` (1)`, ` (2)` and so on.

*Option 2:*<br/>
Make additional subfolders with the same name as the model, and place .jpegs inside with any name you'd like.<br/>
e.g. `api/networks/lora/My-LoRA/file123.jpeg`

Finally, you can add a `filename.txt` file in the same folder for a quick info modal.  Great for storing descriptions, notes, and sample prompts.  You can switch between the modal gallery and the modal notes with the up / down arrow keys while the modal is open.

**Note: Use the full matching filename, minus extension, of the related model/item.**

<br />

#### Why only .JPEG?

Currently this is to keep the file scanning time fast, and the image loading and memory requirements low.  Using a single format means the application doesn't need to check for multiple possible formats per LoRA/checkpoint/etc, or load much larger PNG files.

*Want to use .jpg, .png, or something else?  Simply modify `api/index.js` and change `const imgExt = 'jpeg'`, line 7.*

<br />

Formats such as .PNG can be mass converted while leaving the originals intact using [ImageMagick](https://imagemagick.org) like so:

```
magick mogrify -format jpeg *.png
```

<br />

## Examples:

![howto gif](howto.gif)

---

<a id="keywords"></a>
### the LoRA / image pair:

`api/networks/lora/example-lora_v1_johndoe [mylora] [anotherkeyword] (RevAnimated) {0.7-0.8}.safetensors`<br />
`api/networks/lora/example-lora_v1_johndoe [mylora] [anotherkeyword] (RevAnimated) {0.7-0.8}.jpeg`

will copy to the clipboard:

`mylora, anotherkeyword <lora:my-lora_v1_johndoe [mylora, anotherkeyword] (RevAnimated) {0.7-0.8} #style:0.8>`

with the needed ***keywords and suggested weight ready to go!***

This is based on my personal naming preferences and has worked well for managing a large collection.<br />
If you choose to follow a different naming convention without keywords or weights, the program will still simply copy ```<lora:LoraName:1.0>``` to the clipboard.

---

<a id="weights"></a>
### Another example, Keywords with Weights:

`api/networks/lora/example-lora_v1_johndoe [anotherlora, watercolor (medium), (awesome©️1.4}] [anotherkeyword] (RevAnimated) {1.0}.safetensors`

`api/networks/lora/example-lora_v1_johndoe [anotherlora, watercolor (medium), (awesome©️1.4}] [anotherkeyword] (RevAnimated) {1.0}.jpeg`

Will copy to the clipboard:

`anotherlora, watercolor \(medium\), (awesome:1.4), anotherkeyword <lora:nother-lora_v1_johndoe [anotherlora, (awesome:1.4}] [anotherkeyword] (RevAnimated) {1.0}:1.0>`

Note the ( )'s are escaped as needed on non-weights, and ©️ is replaced by : (because : can't be in a filename).  I've found this very useful when dealing with keywords that have suggested weights.

Without a weight or range, it will default to :1.0.

**ComfyUI Users:** Please note that as of this writing, when loading a LoRA via prompt using the [ComfyUI Prompt Control](https://github.com/asagi4/comfyui-prompt-control) nodes, braces { } in the filename are incompatible even when escaped.  To address this I've made a small custom input node that disables "Dynamic Prompts", which you can find [here](https://github.com/WebDev9000/WebDev9000-Nodes).

<br />

## Misc

### Other Networks:

Hypernetworks will copy the keywords, name, and weight using the formats above:

`keywords <hypernet:NAME:WEIGHT>`

while **Checkpoints** and **Embeddings** will copy the name to the clipboard for easy pasting and/or filtering within the UI of your choice.

#### Where to paste checkpoint names in WebUI and ComfyUI:

![Auto](auto.png) &nbsp;
![Comfy](comfy.png)

then press enter.

---

<a id="styles"></a>
### Styles:

Some LoRA have multiple possible characters, outfits, or activations attached.  Managing all of this in the filename is impractical, and sometimes impossible due to filename length limits.

For that reason I recommend storing activations for LoRA with many keywords in your Styles.csv, either the one created by Auto's WebUI or manually created.

Each entry (name, prompt) in the file then becomes a card, just like LoRA, checkpoints, etc. for easy use.  Simply add a .JPEG file matching each name field to the `api/networks/styles` folder for the preview, and the prompt field will be copied to the clipboard on click.

**The suggested format for styles.csv is:**

```
name,prompt
Name (Author) - Description, "keywords"
```

For example:

```
name,prompt
My-LoRA (John Doe) - Style 1, "keyword1, additional keywords, etc"
My-LoRA (John Doe) - Style 2, "keyword2, additional keywords, etc"
```

**The file must be in the UTF-8 encoding**, not UTF-8 BOM.<br />
Double check your file if it was created by the WebUI.  It should still work fine with the WebUI as UTF-8.

In this example, your matching image files in `api/networks/styles` would be:

`api/networks/styles/My-LoRA (John Doe) - Style 1.jpeg`<br/>
`api/networks/styles/My-LoRA (John Doe) - Style 2.jpeg`

---

<a id="poses"></a>
### Poses:

The Poses tab ("P") is designed to work with OpenPose images used with ControlNet.  In this tab, you can manage examples of those poses for easy browing.

This tab works somewhat differently than the model tabs, in that it looks for images rather than model files.<br />
I've tried to somewhat match the format of many zipped packs I've seen, and as such I recommend the following folder structure:

```
/api/poses/<pose>/
/api/poses/<posefolder>/pose1.png
/api/poses/<posefolder>/pose2.png
/api/poses/<posefolder>/OpenPose/pose1.png   #optional
/api/poses/<posefolder>/OpenPose/pose2.png   #optional
/api/poses/<posefolder>/Depth/pose1.png      #optional
/api/poses/<posefolder>/Canny/pose2.png      #optional
```

The structure here is:
* A general name for the pose folder *(e.g. "Heart Hands" or "T Pose")*
* Example images with the pose inside that folder
* OpenPose mannequin files inside a subfolder called OpenPose
* Optionally any other ControlNet files stored likewise *(e.g. Depth, Canny, or Lineart folders)*

For best compatibility this tab uses **.png** instead of **.jpeg**.
*This can be changed in `api/index.js` by editing `const ext ... "png" : imgExt`, on line 260 to `jpeg`, etc.*

---

<a id="gallery"></a>
### Gallery:

The Gallery tab ("G") looks for *subfolders* inside the `api/networks/gallery/` folder and displays a card for each, using a .jpeg matching the folder name in the `/gallery`.
Examples:
```
api/networks/gallery/saved-images.jpeg     # Gallery folder thumbnail image
api/networks/gallery/saved-images/one.jpeg     # Gallery folder with images
api/networks/gallery/saved-images/two.jpeg     # Gallery folder with images
api/networks/gallery/saved-images/three.jpeg   # Gallery folder with images

api/networks/gallery/testing-images.jpeg   # Gallery folder thumbnail image
api/networks/gallery/testing-images/cat.jpeg   # Gallery folder with images
api/networks/gallery/testing-images/dog.jpeg   # Gallery folder with images
```

<a id="search"></a>
## Advanced Search:
Searching in field at the top will filter the results of the tab you are in: LoRAs / Models / Styles / Gallery, and etc.

You can further drill-down to the *"additional images"* in the [modal gallery](#modal) using a **`>`** character followed by a filename found *inside* of one of the results

Examples:
```
Watercolor          # Filters tab to Watercolor-Lora, Watercolor_v2, etc
Watercolor > 2024   # Filters to individual images inside Watercolor-Lora, Watercolor_v2, etc with filenames containing "2024"
>2024               # Filters to any filename containing '2024' in any LoRA/model/style/etc in the tab.
```

<br />

## Contributing

This repo is a personal project that I am sharing in the hope that others may also find value.<br />
Github does not allow disabling Pull Requests, however please be aware **I am not currently accepting PRs**.
