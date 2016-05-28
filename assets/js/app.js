window.onload = function() {

  var unitsType = localStorage.getItem('unitsType') || 'F';
  var httpGETCounter = 0;

  var cacheData = function (data) {
    localStorage.setItem('timeStamp', new Date());
    localStorage.setItem('weaterData', data);
  }

  var convertTemperature = function (far) {
    // T(°C) = (T(°F) - 32) / 1.8
    var celsius;
    celsius = (far - 32) / 1.8;
    celsius = celsius.toFixed(1);
    return celsius;
  };

  var httpGET = function (url) {
    console.log("httpGET was called " + ++httpGETCounter + " times.");
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);

      xhr.onload = function() {
        if (this.status == 200) {
          resolve(this.response);
        } else {
          reject(runUI(null, "AJAX " + new Error(this.status)));
        }
      };

      xhr.onerror = function() {
        reject(runUI(null, new Error("Network Error")));
      };

      xhr.send();
    });
  };

  var runUI = function (geoData, err) {

    var preloader = document.getElementById('preloader');
    preloader.parentNode.removeChild(preloader);

    if (err) {
      var location = document.getElementById('location');
      location.innerText = err;
      console.log(err);
      return
    }

    var info = JSON.parse(geoData);

    var temperature = document.getElementById('temperature');
    var location = document.getElementById('location');
    var weater = document.getElementById('weater');
    var button = document.getElementById('button');
    var icon = document.getElementById('icon');

    var temp = (unitsType != 'F') ? convertTemperature(info.main.temp) : info.main.temp;
    tempElement = document.createElement('span');
    tempElement.innerText = temp + '°';

    var tempSwitch = document.createElement('button');
    tempSwitch.innerText = "°" + unitsType;
    button.appendChild(tempSwitch);
    temperature.appendChild(tempElement);

    location.innerText = info.name + ', ' + info.sys.country;
    weater.innerText = info.weather[0].description;
    icon.innerHTML = '<img src="//openweathermap.org/img/w/' + info.weather[0].icon +'.png">';

    tempSwitch.addEventListener('click', function(e) {
      switch (unitsType) {
        case 'F':
          localStorage.setItem('unitsType', 'C');
          tempSwitch.innerText = '°C'
          tempElement.innerText = convertTemperature(info.main.temp)  + '°';
          unitsType = 'C';
          break;
        case 'C':
          localStorage.setItem('unitsType', 'F');
          tempSwitch.innerText = '°F'
          tempElement.innerText = info.main.temp  + '°';
          unitsType = 'F';
          break;
      }
    }, false);
  };

  var getCurrentWeater = function () {
    var APIID = 'APPID=7e98326da4614ec8934865af5efe02df';
    var units = 'units=imperial';
    var locationURL  = "//ipinfo.io/json";
    var weatherURL = '//api.openweathermap.org/data/2.5/weather?' + APIID + '&' + units;

    httpGET(locationURL)
      .then(function(response) {
        var data = JSON.parse(response)
        var location = '&q=' + encodeURIComponent(data.city) + ',' + data.country;
        return weatherURL + location;
      })
      .then(function(url) {
        httpGET(url)
          .then(function(response) {
            cacheData(response);
            runUI(response)
          });
      });

  };

  (function() {
    var CACHE_TIME = 10; // mins
    var weaterData = localStorage.getItem('weaterData');
    var timeStamp = localStorage.getItem('timeStamp');
    var timeDifference = Math.floor((new Date() - new Date(timeStamp)) / 60000);

    console.log("Query was cached. Time to the next refresh: " + (10 - timeDifference) + " minutes.")

    if (!weaterData ||  timeDifference > CACHE_TIME) {
      getCurrentWeater()
    } else {
      runUI(weaterData);
    }
  })();

}
