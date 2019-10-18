var fs = require('fs');
var path = require('path');
var mustache = require('consolidate').mustache;
var config = require('../../../config');

var index = require('.');
var defaultAttachments = index.defaultAttachments;
var mjml = index.mjml;

var textTemplate = fs.readFileSync(path.join(__dirname, 'templates/survey.txt'), 'utf8');
var mjmlTemplate = fs.readFileSync(path.join(__dirname, 'templates/survey.mjml'), 'utf8');

function renderAsText(followup) {

    var data = {
        returnURL: `${config.baseURL}${followup.surveyPath}`,
    };

    return mustache.render(textTemplate, data);
}

function renderAsHtml(followup) {

    var data = {
        ctaLink: `${config.baseURL}${followup.surveyPath}`,
        returnURL: `${config.baseURL}${followup.returnPath}`,
    };

    return mustache.render(mjmlTemplate, data)
        .then(function (templateString) {
            const output = mjml(templateString);
            return {
                html: output.html,
                attachments: defaultAttachments
            };
        });
}

function render(followup) {

    return Promise.all([
        renderAsText(followup),
        renderAsHtml(followup)
    ]).then(function (values) {
        return {
            subject: `[${followup.situation._id}] Votre simulation sur Mes-Aides.gouv.fr vous a-t-elle été utile ?`,
            text: values[0],
            html: values[1].html,
            attachments: values[1].attachments,
        };
    });
}

exports.render = render;
