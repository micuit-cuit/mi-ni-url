const miLog = require("mi-log")
const micuitDb = require("micuit-db")
const express = require("express")
const log = new miLog([{text: "mi-ni-url", color: "purple"}])
const app = express()
const fs = require("fs")
log.i("Starting server")

;(async () => {

const pornDomaine = await fetch("https://raw.githubusercontent.com/Bon-Appetit/porn-domains/master/block.txt").then(res => res.text()).then(data => data.split("\n"))

await micuitDb.sync();
const urlModel = micuitDb.models.url
log.i("Database synchronized")

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/src/index.html")
})
app.get("/:url/admin", async (req, res) => {
    const url = await urlModel.findOne({where: {url: req.params.url}})
    const adminPage = fs.readFileSync(__dirname + "/src/admin.html", "utf-8")
    if(url) {
        const url = await urlModel.findOne({where: {url: req.params.url}})
        const redirect = url.redirect
        const ip = url.ip == (req.headers["x-forwarded-for"] ||req.connection.remoteAddress)  ? "You" : "Someone"
        const alias = url.url
        const date = new Date(url.createdAt).toLocaleString()
        res.send(adminPage.replaceAll("{{alias}}", alias).replaceAll("{{redirect}}", redirect).replaceAll("{{ip}}", ip).replaceAll("{{date}}", date))
    }
    else {
        res.redirect("/")
    }
})
app.get("/api/:url/delete", async (req, res) => {
    // suppression de l'url dans la base de données
    log.d("URL requested", req.params.url)
    const url = await urlModel.findOne({where: {url: req.params.url}})
    log.d("URL found", url)
    if(url) {
        await url.destroy()
        res.send(JSON.stringify({status: true}))
    }
    else {
        res.send({error: "URL not found", status: false})
    }
})
app.get("/api/:redirect/:alias/", async (req, res) => {
    const alias = decodeURIComponent(req.params.alias)
    const redirect = decodeURIComponent(req.params.redirect)
    // ajout de l'url dans la base de données
    log.d("URL:"+alias+" Redirect:"+redirect)
    //verifie les donnees d'entree (url dois etre une chaine de caracteres, max 10 caracteres, pas de caracteres speciaux)
    if(alias.length > 30 ) {
        if (alias.length > 30) {
            console.log(alias.length, alias)
            res.send(JSON.stringify({status: false, error: "Alias too long"}))
        }else {
            res.send(JSON.stringify({status: false, error: "Characters not allowed in alias"}))
        }
        return
    }
    //verifie les donnees d'entree (redirect dois etre une url valide en https)
    if(!redirect.match(/^https:\/\/.+/)) {
        res.send(JSON.stringify({status: false, error: "Invalid redirect, only https allowed"}))
        return
    }
    //evite les url local
    if(redirect.includes("localhost") || redirect.includes("127.0.0.1")) {
        res.send(JSON.stringify({status: false, error: "Localhost not allowed"}))
        return
    }
    if (pornDomaine.includes(redirect)) {
        res.send(JSON.stringify({status: false, error: "Porn domaine dectecter"}))
        return
    }


    //verifie si l'url existe deja
    const urlExists = await urlModel.findOne({where: {url: alias}})
    if(urlExists) {
        res.send(JSON.stringify({status: false, error: "alias already exists"}))
        return
    }
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress
    const url = await urlModel.create({url: alias, redirect: redirect, ip: ip})
    log.d("URL created", url)
    res.send(JSON.stringify({status: true}))
})
app.get("/:url", async (req, res) => {
    // recherche de l'url dans la base de données
    log.d("URL requested", req.params.url)
    const url = await urlModel.findOne({where: {url: req.params.url}})
    log.d("URL found", url)
    if(url) {
        res.redirect(url.redirect)
    }
    else {
        res.redirect("/")
    }
})

app.listen(8002, () => {
    log.s("Server started on port 8002")
})



})()