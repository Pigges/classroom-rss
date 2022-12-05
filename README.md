# Classroom RSS

A simple Node.js project to generate RSS feeds for Google Classroom.

## Prerequisites
Requirements for running this
* [Node.js](https://nodejs.org/)
* [npm](https://www.npmjs.com/)
* Create a Google Clooud project

## Create Google Cloud Project

* You will also need to create a Google Cloud project in order to have access to the API.
You can find a guide for it [here](https://developers.google.com/workspace/guides/create-project).

* Then you will need to enable the Classroom API which you can find details for
[here](https://developers.google.com/workspace/guides/enable-apis).

* Then you will have to configure the OAuth consent screen, which you can find
reference to [here](https://developers.google.com/workspace/guides/configure-oauth-consent).

* Now, you will have to create OAuth client ID credentials, which you can find a guide for [here](https://developers.google.com/workspace/guides/create-credentials#oauth-client-id).

* You should then be able to download the credentials as JSON.
Do so and save it to the root of this project.

**The project won't run without the credentials.json file in the root of this repository.**

## Installation
```sh
git clone https://github.com/Pigges/classroom-rss.git
cd classroom-rss
npm i
```

## Run
```sh
npm start
```

## Google API Documentation
* [Google Classroom API reference](https://developers.google.com/classroom/reference/rest)


## License
Distributed under the MIT license. See ``LICENSE`` for more information.

https://github.com/Pigges/classroom-rss

## Contributing

1. Fork it (<https://github.com/Pigges/classroom-rss/fork>)
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request