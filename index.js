const http = require('http')
const https = require('https')
const url = require('url')
var path = require('path')

const util = require('util')

var fs = require('fs')
var index = fs.readFileSync('index.html')
var successHtml = fs.readFileSync('success.html')

var FAVICON = path.join(__dirname, 'favicon.ico')
var STYLE = path.join(__dirname, 'main.css')
var SKETCH = path.join(__dirname, 'img01.png')

const port = process.env.PORT

const server = http.createServer(async (req, res) => {
  const urlParts = url.parse(req.url, true)

  let qObj = {
    path: urlParts.pathname
  }

  if (req.method === 'GET' && qObj.path === '/favicon.ico') {
    res.setHeader('Content-Type', 'image/x-icon')
    fs.createReadStream(FAVICON).pipe(res)
    return
  }

  if (req.method === 'GET' && qObj.path === '/main.css') {
    res.setHeader('Content-Type', 'text/css')
    fs.createReadStream(STYLE).pipe(res)
    return
  }

  if (req.method === 'GET' && qObj.path === '/img01.png') {
    res.setHeader('Content-Type', 'image/png')
    fs.createReadStream(SKETCH).pipe(res)
    return
  }

  if (qObj.path === '/success') {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html')
    res.end(successHtml)
  } else if (qObj.path === '/sub') {
    let body = ''

    await req.on('data', chunk => {
      body = chunk.toString()
      if (body.length > 1e6) request.connection.destroy()
      sub = JSON.parse(body)
    })

    req.on('end', () => {
      console.log('end of stream')
    })

    const data = JSON.stringify({
      email_address: sub.email_address,
      status: 'subscribed',
      tags: ['early-sub']
    })

    // Make request to mailchimp add user
    makeHTTPSRequest({
      url: 'https://us18.api.mailchimp.com/3.0/lists/d11ac5b71e/members',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
          Authorization:
            'Basic ZmRmc3M6MDhkNGQwYTQ4NWM0Zjg2YjM4OThhZjMwMjczZmVkY2EtdXMxOA=='
        }
      },
      data: data,
      onError: r => {
        const error = JSON.parse(r)
        res.end(error)
        // 500 response "something went wrong"
      },
      onSuccess: (r, data) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(
          JSON.stringify({
            statusCode: r.statusCode,
            data: JSON.parse(data)
          })
        )
      }
    })
  } else {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html')
    res.end(index)
  }
})

server.listen(port, () => {
  console.log(`Server running at port ${port}`)
})

const makeHTTPSRequest = async ({
  url,
  options,
  data = {},
  onError = err => console.log('ERROR:', err),
  onSuccess = res => console.log('SUCCESS:', res)
}) => {
  const req = https.request(url, options, res => {
    let data = ''

    res.on('data', d => {
      data += d
    })
    console.log(`statusCode: ${res.statusCode}`)
    res.on('end', () => onSuccess(res, data))
  })

  req.on('error', error => {
    onError(error)
  })

  req.write(data)
  req.end()
}
