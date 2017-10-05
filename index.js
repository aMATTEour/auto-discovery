'use strict';

module.exports = function () {

    const run = true;
    const dataSourceName = 'mysql';

    console.log('__dirname', __dirname);

    let appRoot = require('app-root-path');

    let serverDir = appRoot + '/server';

    let _ = require('lodash');
    let path = require('path');
    let fs = require('fs');
    let loopback = require('loopback');
    let pluralize = require('pluralize');
    const capitaliseFirstLetter = (string) => {
        return string.charAt(0)
            .toUpperCase() + string.slice(1);
    };
    const jsFileString = (model_name) => {
        return '' + 'module.exports = function(' + capitaliseFirstLetter(model_name) + ') {\n' + '\t\n' + '};';
    };
    const toCamelize = (string, firstCapitalize = true) => {
        let result = string.replace(/(?:_| |\b)(\w)/g, ($1) => {
            return $1.toUpperCase().replace('_', '');
    });
        if (firstCapitalize) {
            return result;
        } else {
            return result.charAt(0).toLowerCase() + result.slice(1);
        }
    };
    if (run) {
        let datasource = require(serverDir + '/datasources')[dataSourceName];
        let modelConfigPath = serverDir + '/model-config.json';
        let modelConfig = require(modelConfigPath);
        console.log(datasource);
        let generatedOutputPath = appRoot + '/common/models/generated';

        console.log('generatedOutputPath', generatedOutputPath);

        let outputPath = appRoot + '/common/models';


        let ds = loopback.createDataSource('mysql', datasource);
        return ds.discoverModelDefinitions({schema: datasource.database}, (err, models) => {
            let count = models.length;
        console.log(`${count} models found and will be generated...`);
        _.each(models, (model) => {
            // console.log(`Discovery ${model.name} model`);
            return ds.discoverSchema(model.name, {associations: true, all: true}, (err, schema) => {
                return ds.discoverExportedForeignKeys(model.name, {associations: true, all: true}, (err, foreignKeys) => {
                    let generatedOutputModelJs = generatedOutputPath + '/' + schema.name + 'Model.js';
        let generatedOutputModelJson = generatedOutputPath + '/' + schema.name + 'Model.json';
        let outputModelJs = outputPath + '/' + schema.name + '.js';
        let outputModelJson = outputPath + '/' + schema.name + '.json';
        let schemaName = schema.name;
        // Create generatedModel.json
        schema.name = schemaName + 'Model';
        schema.options.mysql.schema = "lb_db";
        foreignKeys.map(foreignKey => {
            let relation = {
                type: 'hasMany',
                model: toCamelize(foreignKey.fkTableName),
                foreignKey: toCamelize(foreignKey.fkColumnName, false),
            };
        // console.log(relation);
        let relationName = pluralize.plural(toCamelize(foreignKey.fkTableName, false));
        schema.options.relations[relationName] = relation;
    });
        fs.writeFile(generatedOutputModelJson, JSON.stringify(schema, null, 2), (err) => {
            if (err) {
                console.log(err);
            } else {
                let modelSchema = {
                    name: schemaName,
                    base: schemaName + 'Model',
                    idInjection: false,
                    properties: {},
                    validations: [],
                    relations: {},
                    acls: [],
                    methods: {},
                };
        if (!fs.existsSync(outputModelJson)) {
            fs.writeFile(outputModelJson, JSON.stringify(modelSchema, null, 2), (err) => {
                if (err) throw err;
            // console.log('Created ' + schema.name + '.json file');
        });
        }
        // Add model to model-config.json
        if (!modelConfig[schemaName]) {
            modelConfig[schemaName] = {
                'dataSource': dataSourceName,
                'public': false,
            };
            if (fs.existsSync(modelConfigPath)) {
                fs.writeFile(modelConfigPath, JSON.stringify(modelConfig, null, 2), (err) => {
                    if (err) throw err;
                console.log(`${schemaName} added to model-config.json`);
            });
            }
        }
    }
    });
        // Create generatedModel.js
        fs.writeFile(generatedOutputModelJs, jsFileString(schemaName + 'Model'), (err) => {
            if (err) throw err;
        if (!fs.existsSync(outputModelJs)) {
            fs.writeFile(outputModelJs, jsFileString(schemaName), (err) => {
                if (err) throw err;
        });
        }
    });
        count = count - 1;
        if (count === 0) {
            console.log('DONE!');
            ds.disconnect();
        }
    });
    });
    });
    });
    }


};
