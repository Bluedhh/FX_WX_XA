jQuery.support.cors = true;


var config = {
    fistUrl: 'http://demo.i7o7.com/xian/weather/108.06/34.02/get',
    getUrl: 'http://demo.i7o7.com/xian/weather/',
}
var fistUrl = config.fistUrl;
var getUrl = config.getUrl;
var url = fistUrl;
window.onload = function() {
    $('.loadingBG').show();
    weatherAjax(url, function(data) {
        renderHtml(data);
        $('.loadingBG').hide();
        var dataTempLine = {
            labels: [data.HourlyData.W_24h[1].time.substr(-2) + ':00',
                data.HourlyData.W_24h[5].time.substr(-2) + ':00',
                data.HourlyData.W_24h[9].time.substr(-2) + ':00',
                data.HourlyData.W_24h[13].time.substr(-2) + ':00',
                data.HourlyData.W_24h[17].time.substr(-2) + ':00',
                data.HourlyData.W_24h[21].time.substr(-2) + ':00'
            ],
            datasets: [{
                strokeColor: "rgba(255,255,255,1)",
                pointColor: "rgba(220,220,220,1)",
                pointStrokeColor: "#D3D3D3",
                data: [data.HourlyData.W_24h[1].st, data.HourlyData.W_24h[5].st, data.HourlyData.W_24h[9].st,
                    data.HourlyData.W_24h[13].st, data.HourlyData.W_24h[17].st, data.HourlyData.W_24h[21].st
                ]
            }]
        };
    $('#positionPage').on('click', 'li', function() {
    var val = $(this).html();
    var lat = $(this).attr("lat");
    var lon = $(this).attr('lon');
    url = getUrl + lat + "/" + lon + "/get";
    console.log(url);
    $('.loadingBG').show();
    $('.title-bd').html('西安' + val)
    weatherAjax(url, function(data) {
        $('.loadingBG').hide();

        renderHtml(data);

        $('#positionPage').animate({
            width: "0",
            opacity: 0,
            top: "+=50px"
        }, 500);


    });
})
        var dataAqiLine = {
            labels: [data.HourlyData.W_24h[1].time.substr(-2) + ':00',
                data.HourlyData.W_24h[5].time.substr(-2) + ':00',
                data.HourlyData.W_24h[9].time.substr(-2) + ':00',
                data.HourlyData.W_24h[13].time.substr(-2) + ':00',
                data.HourlyData.W_24h[17].time.substr(-2) + ':00',
                data.HourlyData.W_24h[21].time.substr(-2) + ':00'
            ],
            datasets: [{
                strokeColor: "rgba(255,255,255,1)",
                pointColor: "rgba(220,220,220,1)",
                pointStrokeColor: "#D3D3D3",
                data: [noiseAqi(data.HourlyData.W_24h[1].aqi), noiseAqi(data.HourlyData.W_24h[5].aqi), noiseAqi(data.HourlyData.W_24h[9].aqi), noiseAqi(data.HourlyData.W_24h[13].aqi), noiseAqi(data.HourlyData.W_24h[17].aqi), noiseAqi(data.HourlyData.W_24h[21].aqi)]
            }]
        };
        var opt = {
            animationEasing: 'easeOutCirc',
            showScale: true,
            scaleShowHorizontalLines: true,
            scaleShowVerticalLines: false,
            scaleShowGridLines: true,
            scaleGridLineColor: "rgba(255,255,255,0.2)",
            scaleFontColor: '#fefefe',
            responsive: true,
            maintainAspectRatio: false,
            pointDotRadius: 2,
            showTooltips: true,
            tooltipFillColor: "rgba(0,0,0,0)",
            datasetFill: false,
            tooltipTemplate: "<%if (label){%> <%}%><%= value %>",
        };
        var ctx2 = $("#temp24")[0].getContext("2d");
        var tempLine = new Chart(ctx2).Line(dataTempLine, opt);
        var ctx1 = $('#aqi24')[0].getContext('2d');
        var aqiLine = new Chart(ctx1).Line(dataAqiLine, opt);
        //loaded();
        var CLICK = 'click';
        if (/(iPhone|iPad|iOS)/i.test(navigator.userAgent)) {
            CLICK = 'touchstart';
        }
        $('.temp24btn').on(CLICK, function() {
            $('.aqi24btn').removeClass('active');
            $('.temp24btn').addClass('active');
            $('#temp24').show();
            $('#aqi24').hide();
        });
        $('.aqi24btn').on(CLICK, function() {
            $('.temp24btn').removeClass('active');
            $('.aqi24btn').addClass('active');
            $('#temp24').hide();
            $('#aqi24').show();
        });
        $('#currentCity').on(CLICK, function() {
            hotCity();
            $('#positionPage').css({ "top": "0" });
            $('#positionPage').animate({
                width: "100%",
                opacity: 1,
                top: "+=50px"
            }, 500);
        });
        $('.current-city,.hotcitys').bind('click', function() {
            $('#positionPage').animate({
                width: "0",
                opacity: "0",

            }, 500);
            //$("#mainPage").css({"display":"block","position":"relative"})
            $(document).on("touchmove", function(e) {
                e.preventDefault();
            })
        });
        $(".city-list ul li a,.search-result ul li a,.current-city").bind("touchstart", function(event) {
            $(this).addClass("touch-active");
        }).bind("touchend", function() {
            $(this).removeClass("touch-active");
        });
        var inputCityName = $('#inputCityName');
        inputCityName.bind('keyup', function() {
            var jqueryInput = $(this);
            var searchText = jqueryInput.val();
            var html = '',
                cityName;
            if ((inputCityName.val() == undefined) || (inputCityName.val().length == 0)) {
                return;
            }
        });
    })
};

function renderHtml(data) {
    var _month = data.weathernow.upTime.substr(4, 2),
        _day = data.weathernow.upTime.substr(6, 2),
        _hour = data.weathernow.upTime.substr(8, 2),
        _min = data.weathernow.upTime.substr(10, 2);
    $('.date').html('<a href="http://www.mlogcn.com" class="date">' + _month + '/' + _day + '&nbsp;' + _hour + ':' + '00 由象辑科技发布</a>');
    $('#wendu').html(Math.ceil(data.weathernow.tmp) + "<span class='deg'>°</span>");
    $('#aqiwd').html(Math.ceil(data.weathernow.aqi) + fixAqi(data.weathernow.tip_aqi));
    $('.sunny').text(data.weathernow.wcn);
    $('#wlwd').html(data.weathernow.wind);
    $('#humidity').html('湿度 ' + data.weathernow.hum + "%");
    //根据天气判断背景
    if (data.weathernow.wen) {
        $('body').removeClass().addClass((data.weathernow.wen).toLowerCase() + '-bg');
    }
    pushww(data);
}

function pushww(data) {
    var forecast = $('#forecast')[0],
        tpl = forecast.innerHTML,
        html = [];
    for (var s = 0; s < data.weatherweek.length; s++) {
        var _days = data.weatherweek[s].time.substr(4, 2) + '/' + data.weatherweek[s].time.substr(6, 2);
        //the temp need tobe integer,use Math.round()
        var _html = tpl.replace('{{index}}', s)
            .replace('{{tmax}}', Math.round(data.weatherweek[s].tmax))
            .replace('{{tmin}}', Math.round(data.weatherweek[s].tmin))
            .replace('{{day}}', _days)
            .replace('{{wind}}', data.weatherweek[s].wdirdesc)
            .replace('{{windvalue}}', data.weatherweek[s].wclass)
            .replace('{{aqi}}', data.weatherweek[s].tip_aqi)
            .replace('{{aqivalue}}', Math.ceil(data.weatherweek[s].aqi))
            .replace('{{index}}', s)
            .replace('{{index}}', s)
            .replace('{{index}}', s)
            .replace('{{weekday}}', getDayOfWeek(s - 1));
        html.push(_html);
    }
    forecast.innerHTML = html.join('');
    forecast.style.display = "block";
    $('#weekday_1').innerHTML = "今天";
    $('#weather0')[0].style.opacity = 0.5;
    for (var i = 0; i < data.weatherweek.length; i++) {
        $('#wcode_am' + i).attr("src", function() {
            return "resources/img/wicon/weather" + data.weatherweek[i].wcode_am + ".png";
        });
        $('#wcode_pm' + i).attr("src", "resources/img/wicon/weather" + data.weatherweek[i].wcode_pm + ".png");
        var _a = (Math.abs(rettmax(data) - rettmin(data))); //最大值与最小值之间的差值 10
        var _height = 92 * (Math.abs(data.weatherweek[i].tmax - data.weatherweek[i].tmin) / _a);
        var _top = 100;
        if (rettmax(data) == data.weatherweek[i].tmax) {
            _top = 0;
        } else {
            _top = 92 * (Math.abs(rettmax(data) - data.weatherweek[i].tmax) / _a);
        }
        $('#weather' + i + ' .line').attr('style', function() {
            return "height: " + _height + "px; top:" + _top + "px;";
        });
    }
    $.each($('.week_aqi'), function(index, value) {
        if (value.innerHTML.length > 3) {
            value.className += ' scale68';
        }
    });
    if ($('#aqiwd')[0].innerHTML.length > 7) {
        $('#aqiwd')[0].className = 'scale88';
    }
}

function rettmax(data) {
    var tmaxarr = [];
    for (var w = 0; w < data.weatherweek.length - 1; w++) {
        tmaxarr[w] = data.weatherweek[w].tmax;
    }
    return getMaxOfArray(tmaxarr);
}

function rettmin(data) {
    var tminarr = [];
    for (var w = 0; w < data.weatherweek.length - 1; w++) {
        tminarr[w] = data.weatherweek[w].tmin;
    }
    return getMinOfArray(tminarr);
}

function getDayOfWeek(num) {
    var date = new Date();
    var day = '';
    var test = (date.getDay() + num >= 7) ? (date.getDay() + num - 7) : (date.getDay() + num);
    switch (test) {
        case 0:
            day = "周日";
            break;
        case 1:
            day = "周一";
            break;
        case 2:
            day = "周二";
            break;
        case 3:
            day = "周三";
            break;
        case 4:
            day = "周四";
            break;
        case 5:
            day = "周五";
            break;
        case 6:
            day = "周六";
            break;
        default:
            day = "N/A";
            break;
    }
    return day;
}

function getMaxOfArray(numArray) {
    return Math.max.apply(null, numArray);
}

function getMinOfArray(numArray) {
    return Math.min.apply(null, numArray);
}

function weatherAjax(url, callback) {
    $.ajax({
        url: url,
        type: 'get',
        dataType: 'json',
        contentType: "application/x-www-form-urlencoded; charset=utf-8",
        error: function() {
            console.log('ajax error');
        },
        success: callback
    });
}

function hotCity() {
    $('#resultPanel').css("visibility", "hidden");
    var html = '';
    var htmlyudao = "";
    var citys = [
        { name: "主城区", "y": "108.946", "x": "34.347" },
        { name: "莲湖区", "y": "108.946", "x": "34.27" },
        { name: "高陵区", "y": "109.073", "x": "34.51" },
        { name: "临潼区", "y": "109.22", "x": "34.372" },
        { name: "长安区", "y": "108.91", "x": "34.163" },
        { name: "新城区", "y": "108.96", "x": "34.27" },
        { name: "雁塔区", "y": "108.95", "x": "34.22" },
        { name: "周至县", "y": "108.22", "x": "34.169" },
        { name: "碑林区", "y": "108.94", "x": "34.23" },
        { name: "户县", "y": "108.611", "x": "34.114" },
        { name: "阎良区", "y": "109.23", "x": "34.668" },
        { name: "灞桥区", "y": "109.07", "x": "34.278" },
        { name: "蓝田县", "y": "109.32", "x": "34.157" },
        { name: "未央区", "y": "108.95", "x": "34.29" }
    ];
    var yudao = [
        { name: "东汤峪", "y": "108.946", "x": "34.347" },
        { name: "大峪", "y": "108.087", "x": "35.041" },
        { name: "太乙峪", "y": "107.805", "x": "35.211" },
        { name: "太平峪", "y": "107.756", "x": "34.280" },
        { name: "子午峪", "y": "108.848", "x": "34.53" },
        { name: "小峪", "y": "108.946", "x": "34.27" },
        { name: "就峪", "y": "109.073", "x": "34.51" },
        { name: "库峪", "y": "109.22", "x": "34.372" },
        { name: "抱龙峪", "y": "108.712", "x": "34.33" },
        { name: "曲峪", "y": "108.91", "x": "34.163" },
        { name: "沣峪", "y": "108.96", "x": "34.27" },
        { name: "流峪", "y": "108.95", "x": "34.22" },
        { name: "涝峪", "y": "108.22", "x": "34.169" },
        { name: "甘峪", "y": "108.94", "x": "34.23" },
        { name: "田峪", "y": "108.611", "x": "34.114" },
        { name: "石砭峪", "y": "109.23", "x": "34.668" },
        { name: "祥峪", "y": "109.07", "x": "34.278" },
        { name: "耿峪", "y": "108.95", "x": "34.29" },
        { name: '西骆峪', 'y': '99', 'x': '34.29' },
        { name: "辋峪", "y": "109.07", "x": "34.278" },
        { name: "道沟峪", "y": "108.95", "x": "34.29" },
        { name: '高冠峪', 'y': '99', 'x': '34.29' },
        { name: '黑河峪', 'y': '99', 'x': '34.29' }
    ]

    $.each(citys, function(index, item) {
        html += ("<li class='hotcitys' lat=" + item.y + "\n" + "lon = " + item.x + ">" + item.name + "</li>");

    })
    $.each(yudao, function(index, item) {
            htmlyudao += ("<li class='hotcitys' lat=" + item.y + "\n" + "lon = " + item.x + ">" + item.name + "</li>");

        })
        /*     html += ('<li class="hotcitys">'+citys[i]+'</li>', getRequest('openid'), citys[i].y, citys[i].x, i, i);
         }*/
    $('#listHotCitys').html(html);
    $('#listYudao').html(htmlyudao);
}

function sprintf() {
    var arg = arguments,
        str = arg[0] || '',
        i, n;
    for (i = 1, n = arg.length; i < n; i++) {
        str = str.replace(/%s/, arg[i]);
    }
    return str;
}

function getRequest(req) {
    var url = location.pathname,
        requestArr = [];
    if (url.indexOf("/") != -1) {
        requestArr = url.substr(15).split('/');
    }
    switch (req) {
        case 'openid':
            return requestArr[0];
            break;
        case 'x':
            return requestArr[2];
            break;
        case 'y':
            return requestArr[1];
            break;
        case 'district':
            return requestArr[3];
            break;
        default:
            return requestArr;
    }
}

function fixAqi(aqi) {
    return aqi.length > 2 ? aqi : "空气" + aqi;
}

function noiseAqi(min) {
    if (min == 60 || min == 90 || min == 30) {
        var max = min + 3;
        min = min - 3;
        return Math.ceil(Math.random() * (max - min) + min);
    } else {
        return min;
    }
}
$.fn.extend({
    "preventScroll": function() {
        $(this).each(function() {
            var _this = this;
            if (navigator.userAgent.indexOf('Firefox') >= 0) { //firefox  
                _this.addEventListener('DOMMouseScroll', function(e) {
                    _this.scrollTop += e.detail > 0 ? 60 : -60;
                    e.preventDefault();
                }, false);
            } else {
                _this.onmousewheel = function(e) {
                    e = e || window.event;
                    _this.scrollTop += e.wheelDelta > 0 ? -60 : 60;
                    return false;
                };
            }
        })
    }
});
$("#positionPage").preventScroll();
