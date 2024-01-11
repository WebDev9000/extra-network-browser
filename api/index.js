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
app.use('/gallery', express.static('networks/gallery'))

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

    if (searchType == "gallery") {
      // Gallery searches for a list of folders rather than a list of models.

      let pattern = ''
      let extraPattern = ''
      let _onlyDirectories = true

      if (searchTerm) {
        if (searchTerm.split(">").length > 1) {
          pattern = searchTerm.split(">")[0] ? `*${searchTerm.split(">")[0]}*` : '*'
          extraPattern = '/' + (searchTerm.split(">")[1] ? `*${searchTerm.split(">")[1]}*` : '*')
          _onlyDirectories = false
        } else {
          pattern = `*${searchTerm}*`
        }
      } else {
        pattern = '*'
      }

      const files = fg.globSync([`networks/${searchType}/**/${pattern}${extraPattern}`], { onlyDirectories: _onlyDirectories, dot: true, caseSensitiveMatch: false, stats: true })

      images = files.map(file => {
        // Expected filename example:
        // "name1-name2_author [keyword1, keyword2] [keyword3, keyword4] (model) {weight1-weight2} #tag1 #tag2.jpeg"

        let filename = (file.name.indexOf("." + imgExt) > -1) ? file.name : file.name + "." + imgExt
        let path = file.path.replace(file.name, '').replace('networks/', '').toLowerCase()

        // This return only for files.map
        return {
          filename: filename,
          path: path,
        }
      })
      res.json(images)

    } else {
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

      let pattern = ''
      let extraPattern = ''

      if (searchTerm) {
        if (searchTerm.split(">").length > 1) {
          pattern = searchTerm.split(">")[0] ? `*${searchTerm.split(">")[0]}*` : '*'
          extraPattern = '/' + (searchTerm.split(">")[1] ? `*${searchTerm.split(">")[1]}*` : '*')
        } else {
          pattern = `*${searchTerm}*`
          extraPattern = "." + ext
        }
      } else {
        pattern = '*'
        extraPattern = "." + ext
      }

      const files = fg.globSync([`networks/${searchType}/**/${pattern}${extraPattern}`], { dot: true, caseSensitiveMatch: false, stats: true })

      images = files.map(file => {
        // Expected filename example:
        // "name1-name2_author [keyword1, keyword2] [keyword3, keyword4] (model) {weight1-weight2} #tag1 #tag2.jpeg"

        let filematch = file.name.match(/(.*)\.(.*?)$/)
        let filename = filematch ? filematch[1] + "." + imgExt : ""
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

        // This return only for files.map
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

  }
})

// Endpoint to return images
app.get('/moreImages', (req, res) => {

  const search = req.query.search || res.status(400).send({
    message: 'Missing query.'
  });

  // Chars like {} break the glob search if unescaped.
  const filteredSearch = search.replaceAll('$','\\$')
    .replaceAll('^','\\^')
    .replaceAll('?','\\?')
    .replaceAll('(','\\(')
    .replaceAll(')','\\)')
    .replaceAll('[','\\[')
    .replaceAll(']','\\]')
    .replaceAll('{','\\{')
    .replaceAll('}','\\}')

  const noext = filteredSearch.substring(filteredSearch.lastIndexOf('/') + 1).replace('.' + imgExt, '')
  const searchPath = filteredSearch.substring(0, filteredSearch.lastIndexOf('/'))

  const query = `networks/${searchPath}/${noext}(.*|).${imgExt}`
  const queryFolder = `networks/${searchPath}/${noext}/*.${imgExt}`
  const files = fg.globSync([query, queryFolder], { dot: true, caseSensitiveMatch: false, stats: true })

  const images = files.map(file => {
  const path = file.path.replace(file.name, '').replace('networks/', '').toLowerCase()

    // This return is only for files.map
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