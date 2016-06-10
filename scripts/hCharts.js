$(document).ready(function() {
    var chart = {
        backgroundColor:{
        linearGradient: [0, 0, 500, 500],
                stops: [
                    [0, 'rgb(72, 184, 238)'],
                    [1, 'rgb(143, 211, 299)']
                ]},
                 marginTop: 40,
                  marginBottom: 25,
      type:'line'
    };
     var title = "NULL";
var tooltip = {
    borderWidth: 0,
    borderRadius: 15,
    shadow: false,
    borderWidth: 0,
    style: {
        fontSize: 16,
        color: '#48B8EE',
        width: 1000,
        height: 20,
        padding: 8

    },
    pointFormat: '{point.y}',
    formatter: function() {
        return this.y;
    }
};
    /*    var yAxis = {
            plotLines: [{
                value: 0,
                width: 1,
                 color: '#808080'  
            }]
        };*/
    var plotOptions = {
        series:{
         lineWidth:2.5,
         lineColor:'white'
        }
    };
    var yAxis = {
        lineWidth: 2,
         gridLineWidth:0,
          title:'NULL',
          labels:{
            style:{
               color:'white'
            }
          }
    };
    var xAxis = {
      lineWidth:2,
      gridLineWidth:0,
      title:'NULL',
       labels:{
            style:{
               color:'white'
            }
          }
    }
    var legend = {
        enabled: false
    };

    /* var  lineWidth = 1;
     var lineColor = '#F0FFF0';*/
    /*  var tooltip = {
          valueSuffix: '\xB0C'
      };*/
    var series = [{
        data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2
        ],
         marker: {
            radius:4,
                    symbol: 'circle',//点形状
                    fillColor: 'white',//点填充色
                }

    }];

    var json = {};
    json.legend = legend;
    json.title = title;
    // json.lineColor = lineColor;
    // json.lineWidth = lineWidth;
    json.chart = chart;
    json.yAxis = yAxis;
    json.xAxis = xAxis;
    json.tooltip = tooltip;
    json.series = series;
    json.plotOptions = plotOptions;

/*    $('.waterContainer').highcharts(json);
    $('.waterTwoContainer').highcharts(json);
     $('.rainContainer').highcharts(json);*/
});
