var RTEI = RTEI || {}
RTEI.charts = (function() {

  var baseChartConfig = {
    bindto: '#chart',
    data: {
      json: null,
      order: null,
      type: 'bar'
    },
    axis: {
      rotated: true,
      x: {
          type: 'category',
          show: true,
          tick: {
            multiline: false
          }
      },
      y: {
          show: true,
          max: 100,
          padding: {
              top: 10
          }
      }
    },
    bar: {
        width: 16
    },
    tooltip: {
      format: {
        value: function (value, ratio, id, index) {
          if (id == RTEI.insufficientData) {
            return '';
          }
          if (RTEI.charts.isInsufficientDataValue(value)) {
            return RTEI.insufficientData;
          }
          if (id.substring(0, 1) != 't') {
            if (id.indexOf('.') === -1) {
              if (id == 'O' || id == 'P' || id == 'S') {
                if (id == 'O') {
                  return RTEI.formatScore(value / 0.7);
                } else {
                  return RTEI.formatScore(value / 0.15);
                }
              } else {
                return RTEI.formatScore(value * RTEI.charts.categoriesLength.index);
              }
            } else {
              var key = id.split('.')[0];
              return RTEI.formatScore(value * RTEI.charts.categoriesLength[key]);
            }
          } else {
            return value;
          }
        }
      }
    },
    size: {
      height: 150
    },
    padding: {
      bottom: 20
    },
    transition: {
      duration: 300
    }
  }

  var register = {};

  return {

    categoriesLength: {},

    isInsufficientDataValue: function(value) {
      return (value == RTEI.insufficientData || (value % 1).toFixed(9) == '0.123456789');
    },

    initChartConfig: function(chartId, data, customChartConfig, names) {

      var config = $.extend(true, {}, baseChartConfig, customChartConfig);
      if (!config.data.json) {
        config.data.json= data;
      }

      if (names) {
        config.data.names = names;
        var colors = {};
        var indicator, subIndicator;
        for (var key in names) {
          if (names.hasOwnProperty(key)) {
            if (key.substring(0, 1) == 't') {
              // Theme, use the default
              colors[key] = RTEI.colors.index[0];
            } else if (key.indexOf('.') !== -1) {
              // Indicator level 2
              indicator = key.split('.')[0];
              subIndicator = key.split('.')[1];
              colors[key] = RTEI.colors[indicator][parseInt(subIndicator) - 1];

              if (RTEI.charts.categoriesLength[indicator]) {
                RTEI.charts.categoriesLength[indicator]++;
              } else {
                RTEI.charts.categoriesLength[indicator] = 1;
              }
            } else {
              //Indicator level 1
              colors[key] = RTEI.colors[key][0];
              if (RTEI.charts.categoriesLength['index']) {
                RTEI.charts.categoriesLength['index']++;
              } else {
                RTEI.charts.categoriesLength['index'] = 1;
              }
            }
          }
        }
		colors[RTEI.insufficientData] = '#bebebd';
        config.data.colors = colors;
        config.data.color = function(color, d) {
          return (RTEI.charts.isInsufficientDataValue(d.value)) ? '#bebebd' : color;
        }
      }

      register[chartId] = {};
      register[chartId].config = config;

      return config;
    },

    updateChartConfig: function(chartId, customConfig) {
      var config = register[chartId].config;
      $.extend(true, config, customConfig);

      return config;
    },

    handleChartValuesLegacy: function(code, config) {
        var values = [];
        if (code == 'index') {
          values = ['1', '2', '3', '4', '5'];
        } else if (code.substring(0, 1) != 't') {
          for (var key in config.data.names) {
            if (config.data.names.hasOwnProperty(key) &&
                key.substring(0, 1) == code &&
                key.indexOf('.') !== -1) {
              values.push(key);
            }
          }
        } else {
          values = [code]
        }
        return values;
    },

    handleChartValues: function(code, config) {
      var values = [];
      if (code == 'index') {
        values = ['S', 'P', 'O'];
      } else if (code.substring(0, 1) != 't') {
        noData = [];
        for (var i = 0; i < config.data.json.length; i++) {
          country = config.data.json[i];

          if (RTEI.charts.isInsufficientDataValue(country[code])) {
            // All theme (1,2,3,4) has insufficient data
            noData.push(country['name']);
			country[RTEI.insufficientData] = 100.123456789;
			values = [RTEI.insufficientData];
          } else {
            for (var key in config.data.names) {
              if (key.substring(0, 1) == code) {
                if (RTEI.charts.isInsufficientDataValue(country[key])) {
                  country[key] = Math.round(100 / RTEI.charts.categoriesLength[key.substring(0, 1)]) + 0.123456789;
                }
              }
            }
          }
        }
        if (values.indexOf(RTEI.insufficientData) === -1) {
          for (var key in config.data.names) {
            if (config.data.names.hasOwnProperty(key) &&
              key.substring(0, 1) == code &&
              key.indexOf('.') !== -1) {
              values.push(key);
            }
          }
		}
      } else {
        values = [code]
      }

      return values;
    },

    updateChart: function(chartId, code) {
      var config = register[chartId].config;
      var chart = register[chartId].chart;

      if (chart) {
        chart = chart.destroy;
      }

      var values = (RTEI.year < 2017) ? this.handleChartValuesLegacy(code, config) :
        this.handleChartValues(code, config);
      values.sort()

      var customConfig = $.extend(true, {}, config, {
        data: {
          keys : {
            x: 'name',
            value: values
          },
          groups: [
            values
          ]
        }
      });

      register[chartId].chart = c3.generate(customConfig);
      return register[chartId].chart
    }
  }

})();
