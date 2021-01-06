const fs = require('fs')
const mysql = require('mysql')

// model
const Forum = require('../models/Forum')

// mysql db
const dbConfig = require('../db_config')
const db = mysql.createPool(dbConfig.params)

exports.getAllForumsGlobal = (req, res, next) => {
    db.query(
        `SELECT a.id as user_id,
                a.firstname,
                a.lastname,
                a.pic_url,
                f.id,
                f.text,
                f.image_url,
                f.created_at
        FROM Accounts as a
        INNER JOIN Forums as f
        ON a.id = f.user_id
        ORDER BY f.created_at DESC
        `, (err, result) => {
        if(err) {
            return res.status(400).json({ sub_err: "La récupération du fil d'actualité a échouée, veuillez réessayer dans quelques instants.", err })
        }
        // if user doesn't have custom icon, replace by vanilla icon
        result.forEach(userForum => {
            if(!userForum.pic_url) {
                userForum.pic_url = "http://localhost:3000/images/user-icon.jpg"
            }
        });
        
        res.status(200).json({ result })
    })
}

exports.createOneForumGlobal = (req, res, next) => {
    let forum_text = JSON.parse(req.body.forum).text
    let user_id = JSON.parse(req.body.user).id
    
    // required fields
    if (forum_text && user_id) {
        let dataValidation
        dataValidation = Forum.validate({user_id:user_id, text:forum_text})
        
        // data validation failed
        if(dataValidation.error) {
          let dataValidationError = {
            message: dataValidation.error.details[0].message,
            code: dataValidation.error.details[0].type
          }
          return res.status(400).json({ sub_err: "Validation de donnée: Il semblerait que l'un des champs requis est incorrect.", err: dataValidationError })
        }
        // data validation success
        else {
            let forum_image_url
            let dbQuery
            
            // if image attach
            if (req.file) {
                forum_image_url = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
                dbQuery = `INSERT INTO Forums (user_id, text, image_url) VALUES (${user_id}, '${forum_text}', '${forum_image_url}')`
            }
            // else
            else{
                dbQuery = `INSERT INTO Forums (user_id, text) VALUES (${user_id}, '${forum_text}')`
            }
            // insert in db the new forum
            db.query(dbQuery, (err, result) => {
                // error handler
                if(err) {
                    fs.unlink(`images/${forum_image_url.split('/images/')[1]}`, (err => {
                        if(err) {
                            res.status(500).json({ err })
                        }
                    }))
                    return res.status(400).json({ sub_err: "La création du forum a échoué, veuillez réessayer dans quelques instants..", err })
                }
                // forum created
                return res.status(200).json({
                  message: `Le forum a été créé avec succès !`,
                })
            })
        }
    }
    // fields missing
    else{
        return res.status(400).json({ sub_err: "Validation de donnée: Il semblerait que l'un des champs requis est manquant." })
    }
}

exports.getAllForumsUser = (req, res, next) => {
    let user_id = req.body[0].id

    db.query(
        `SELECT a.id as user_id,
                a.firstname,
                a.lastname,
                a.pic_url,
                f.id,
                f.text,
                f.image_url,
                f.created_at
        FROM Accounts as a
        INNER JOIN Forums as f
        ON a.id = f.user_id
        WHERE f.user_id = ${user_id}
        ORDER BY f.created_at DESC
        `, (err, result) => {
        if(err) {
            return res.status(400).json({ sub_err: "La récupération du fil d'actualité personnel a échouée, veuillez réessayer dans quelques instants.", err })
        }
        // if user doesn't have custom icon, replace by vanilla icon
        result.forEach(userForum => {
            if(!userForum.pic_url) {
                userForum.pic_url = "http://localhost:3000/images/user-icon.jpg"
            }
        });
        
        return res.status(200).json({ result })
    })
}

exports.getAllForumsTrends = (req, res, next) => {
    db.query(
        `SELECT a.firstname,
                a.lastname,
                a.pic_url,
                f.text,
                f.created_at
        FROM Accounts as a
        INNER JOIN Forums as f
        ON a.id = f.user_id
        ORDER BY f.created_at DESC
        LIMIT 3`, (err, result) => {
        if(err) {
            return res.status(400).json({ sub_err: "La récupération du fil d'actualité personnel a échouée, veuillez réessayer dans quelques instants.", err })
        }
        // if user doesn't have custom icon, replace by vanilla icon
        result.forEach(userForum => {
            if(!userForum.pic_url) {
                userForum.pic_url = "http://localhost:3000/images/user-icon.jpg"
            }
        });
        
        return res.status(200).json({ result })
    })
}