const express = require('express')
const app = express()
const path = require('path')
const fg = require('fast-glob')

const port = 3000
const imgExt = 'jpeg'

app.use(express.urlencoded({ extended: true }))

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

app.use('/lora', express.static('networks/lora'))
app.use('/styles', express.static('networks/styles'))
app.use('/checkpoints', express.static('networks/checkpoints'))
app.use('/embeddings', express.static('networks/embeddings'))
app.use('/hypernets', express.static('networks/hypernets'))

// Endpoint to return images
app.get('/images', (req, res) => {

  const searchTerm = req.query.search || null
  const searchType = req.query.type || 'lora'
  let images = []

  if (searchType == "styles") {
    // ********* STYLES *********
    // Styles uses a CSV file

    const fs = require('fs')
    const {parse} = require ('csv-parse')
    const pattern = searchTerm ? `.*?${searchTerm}.*` : '.*'
    const re = new RegExp(pattern, 'gi')

    let index = -1

    fs.createReadStream('networks/styles.csv')
      .pipe(parse({ delimiter: ',', columns: true, trim: true }))
      .on('data', (row) => {
        if (row.name.match(re) || row.prompt.match(re)) {
          let imageData = {
            filename: row.name + "." + imgExt,
            path: "styles/",
            name: row.name,
            author: null,
            tags: null,
            keywords: null,
            weight: null,
            prompt: row.prompt,
            mtimeMs: index++,
            mtime: null,
          }
          images.push(imageData);
        }
      })
      .on('end', () => {
        res.json(images)
      });

  } else {
    // ********* GLOB *********
    // Everything else uses a GLOB

    const pattern = searchTerm ? `*${searchTerm}*` : '*'
    let ext = null
    if (searchType == "lora" || searchType == "checkpoints") {
      ext = "safetensors"
    } else if (searchType == "embeddings" || searchType == "hypernets") {
      ext = "(pt|safetensors)"
    } else {
      return res.status(400).send({
        message: 'Invalid type requested.'
      });
    }
    const files = fg.globSync([`networks/${searchType}/**/${pattern}.${ext}`], { dot: true, caseSensitiveMatch: false, stats: true })
    images = files.map(file => {

      // Expected filename example:
      // "name1-name2_author [keyword1, keyword2] [keyword3, keyword4] (model) {weight1-weight2} #tag1 #tag2.jpeg"

      let filematch = file.name.match(/(.*)\.(safetensors|ckpt|pt|bin)$/)
      filename = filematch ? filematch[1] + "." + imgExt : ""
      let noext = filematch ? filematch[1] : ""
      let words = noext.split(' ')
      let path = file.path.replace(file.name, '').replace('networks/', '').toLowerCase()
      let name =  noext.match(/^(.*)_([0-9a-zA-Z]+)\s/)
      name = name ? name[1] : null
      let author = noext.match(/_([0-9a-zA-Z]+)\s/)
      author = author ? author[1] : null
      let hashtagWords = words.filter(word => word.startsWith("#"))
      let tags = hashtagWords.map(word => word.slice(1))
      let weight = noext.match(/{(?:[0-9]*\.?[0-9]+\s?-)?([0-9]*\.?[0-9]+)}/)
      weight = weight ? weight[1] : "1.0"

      let keywords = filename.match(/\[(.*)\]/)
      if (keywords) {
        keywords = keywords[1]
        keywords = keywords.replaceAll(/©️/g, ':')
        keywords = keywords.replaceAll(/≻/g, '>')
        keywords = keywords.replaceAll(/≺/g, '<')
        keywords = keywords.replaceAll(/(\w+?) \((\w+?)\)/gi, '$1 \\($2\\)')
        keywords = keywords.replaceAll('[', '')
        keywords = keywords.replaceAll(']', ', ')
      }

      let prompt = null
      if (searchType == "lora") {
        prompt = `${keywords ? keywords+" " : ""}<lora:${noext}:${weight}>`
      } else if (searchType == "hypernets") {
        prompt = `${keywords ? keywords+" " : ""}<hypernet:${noext}:${weight}>`
      } else {
        prompt = noext
      }

      // This return is for the files map
      return {
        filename: filename,
        path: path,
        name: name,
        author: author,
        tags: tags,
        keywords: keywords,
        weight: weight,
        prompt: prompt,
        mtimeMs: file.stats.mtimeMs,
        mtime: file.stats.mtime,
      }
    })
    res.json(images)
  }
})

// Endpoint to return images
app.get('/moreImages', (req, res) => {

  const search = req.query.search || res.status(400).send({
    message: 'Missing query.'
  });

  const noext = search.replace('.' + imgExt, '')
    .replaceAll('$','\\$')
    .replaceAll('^','\\^')
    .replaceAll('+','\\+')
    .replaceAll('?','\\?')
    .replaceAll('(','\\(')
    .replaceAll(')','\\)')
    .replaceAll('[','\\[')
    .replaceAll(']','\\]')
    .replaceAll('{','\\{')
    .replaceAll('}','\\}')
  const query = `networks/${noext}(.*|).${imgExt}`
  const files = fg.globSync([query], { dot: true, caseSensitiveMatch: false, stats: true })

  const images = files.map(file => {
    const path = file.path.replace(file.name, '').replace('networks/', '').toLowerCase()

    // This return is for the files map
    return {
      filename: file.name,
      path: path,
      mtimeMs: file.stats.mtimeMs,
      mtime: file.stats.mtime,
    }
  })

  res.json(images)
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})