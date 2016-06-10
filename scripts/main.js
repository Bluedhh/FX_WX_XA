jQuery.support.cors = true;
var ODMS = 86400000;
var defaultSTime;
var defaultETime;
var timeNow;
var rainMax = 0;
var rainAvr = 0;
var elemArray = [];
var timeArray = [];
var code = [];
var codeNum;
var text;
var map;
var tool;
var scaleStep = 0;
var config = {
    countryUrl: 'http://dev.api.mlogcn.com:8000/xian/pptn/country',
    cityUrl: 'http://dev.api.mlogcn.com:8000/xian/pptn/get?type=PP',
    codeUrl: 'http://dev.api.mlogcn.com:8000/xian/pptn/',
    river: 'http://dev.api.mlogcn.com:8000/xian/river/get', //河道
    rsvr: 'http://dev.api.mlogcn.com:8000/xian/rsvr/get', //水库
    yudao: 'http://dev.api.mlogcn.com:8000/xian/pptn/valley',
    flood: 'http://dev.api.mlogcn.com:8000/xian/warn/flood/get',
    near: 'http://dev.api.mlogcn.com:8000/xian/warn/near/get',
    valleyGet: 'http://dev.api.mlogcn.com:8000/xian/warn/valley/get',
    qxPre: 'http://dev.api.mlogcn.com:8000/xian/weather/alarm/get?cityId=101110101'
};

function time(fmt, num, time) {
    var date = new Date()
    console.log(date);
    if (num) {
        date = new Date(date.getTime() + num);
    }
    if (time) {
        date = new Date(time);
    }

    var D = {
        'M+': date.getMonth() + 1, //月份
        'd+': date.getDate(), //日
        'h+': date.getHours(), //小时
        'm+': date.getMinutes(), //分
        's+': date.getSeconds(), //秒
        'S': date.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }

    for (var k in D) {
        if (new RegExp('(' + k + ')').test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (D[k]) : (('00' + D[k]).substr(('' + D[k]).length)));
        }
    }
    return fmt;
}

function showLine(height, width, mask) {
    setTimeout(function() {
        $(mask).show();
    }, 500)

}

function urlReq(url) {
    return $.ajax({
        url: url,
        type: 'get',
        timeout: 20000,
        dataType: 'json',
        beforeSend: function() {
            //todo $loading.show();
            $('.loadingBG').show();
        }
    });
};

//分页的显示与隐藏
$("#xifenye").click(function(a) {
    $("#uljia").empty();
    $("#xab").toggle();
    //显示出的一共多少页
    var uljia = $("#uljia");
    var page = parseInt($("#xiye").html()); //获取当前的页数
    var pages = parseInt($("#mo").html()); //获取当前的总页数
    for (var i = 1; i <= pages; i++) {
        var H = "<li>" + i + "</li>"; //添加一共多少页和点击事件
        uljia.append(H);
    }

    $('#uljia li').bind('touchstart', function() {
        var v = document.getElementById("li");
        var num = this.innerHTML;
        console.log(num);
        $("#xiye").empty();
        $("#xiye").html(num);
        $('.city-contant').hide();
        $('.city-contant').eq(num - 1).show();
        $('.shuiku-contant').hide();
        $('.shuiku-contant').eq(num - 1).show();
        $('.hedao-content').hide();
        $('.hedao-content').eq(num - 1).show();
        $('.quxian-content').hide();
        $('.quxian-content').eq(num - 1).show();
    });
    scrolltop(page);
})

function getTime() {
    defaultSTime = time('yyyyMMddhhmm', -3600000) + '00';
    defaultETime = time('yyyyMMddhhmm') + '00';
    timeNow = defaultSTime.substring(0, 4) + '-' + defaultSTime.substring(4, 6) + '-' + defaultSTime.substring(6, 8) + '&nbsp;&nbsp;' + defaultSTime.substring(8, 10) + ':' + defaultSTime.substring(10, 12) + '&nbsp;&nbsp;至&nbsp;&nbsp;' + defaultETime.substring(4, 6) + '-' + defaultETime.substring(6, 8) + '&nbsp;&nbsp;' + defaultETime.substring(8, 10) + ':' + defaultETime.substring(10, 12);
    $('.middle .time').html(timeNow);

}
var timeDefaultArray = [];

function getArray() {
    var d = 0;
    for (var i = 1; i <= 4; i++) {

        var t = time('yyyyMMddhhmm', -d) + '00';
        //     var str = t.substring(4, 6) + '-' + t.substring(6, 8) +"\n" + t.substring(8, 10) + ':' + t.substring(10, 12);
        timeDefaultArray.push(t);
        d = d + i * 6 * 3600000;
    }
    timeDefaultArray.reverse()
}
getArray();

//分页的的上一页和下一页
function topclick() {
    var v = document.getElementById("xiye");
    var num = v.innerHTML;
    if (num > 1) {
        if ($('.whole-City').is(':visible')) {
            $('.city-contant:visible').prev().show();
            $('.city-contant').eq(num - 1).hide();
        }
        if ($('.deRainCon').is(':visible')) {
            $('.quxian-content:visible').prev().show();
            $('.quxian-content').eq(num - 1).hide();
        }
        if ($('.hedao').is(':visible')) {
            $('.hedao-content:visible').prev().show();
            $('.hedao-content').eq(num - 1).hide();
        }
        if ($('.shuiku').is(':visible')) {
            $('.shuiku-contant:visible').prev().show();
            $('.shuiku-contant').eq(num - 1).hide();
        }
        num--;
        v.innerHTML = num;
        var hei = 25 * num - 25;
        $("#xab").scrollTop(hei);
        $('.shuiku-contant')[0].scrollTop = 0;
        $('.hedao-content')[0].scrollTop = 0;
        $('.quxian-content')[0].scrollTop = 0;
        $('.city-contant')[0].scrollTop = 0;
    }
}

function downclick() {
    var pages = parseInt($("#mo").html()); //获取当前的总页数
    var v = $("#xiye");
    var num = parseInt(v.html());
    if (num < pages) {
        if ($('.whole-City').is(':visible')) {
            $('.city-contant:visible').next().show();
            $('.city-contant').eq(num - 1).hide();
        }
        if ($('.rainCon').is(':visible')) {
            $('.rainCon .quxian-content:visible').next().show();
            $('.rainCon .quxian-content').eq(num - 1).hide();
        }
        if ($('.yudao').is(':visible')) {
            $('.yudao .quxian-content:visible').next().show();
            $('.yudao .quxian-content').eq(num - 1).hide();
        }
        if ($('.hedao').is(':visible')) {
            $('.hedao-content:visible').next().show();
            $('.hedao-content').eq(num - 1).hide();
        }
        if ($('.shuiku').is(':visible')) {
            $('.shuiku-contant:visible').next().show();
            $('.shuiku-contant').eq(num - 1).hide();
        }
        num = ++num;
        v.html(num);
        scrolltop(num);
    }

}
//滚动条
function scrolltop(top) {
    var hei = 25 * top - 25;
    $("#xab").scrollTop(hei);
}
//路径初始化
var valleyGet = config.valleyGet;
var flood = config.flood;
var yudao = config.yudao;
var cityUrl = config.cityUrl;
var codeUrl = config.codeUrl;
var countryUrl = config.countryUrl;
var rsvr = config.rsvr;
var river = config.river;
var rainCity = config.rainCity;
var qxPre = config.qxPre;
var rainTable = config.rainTable;
var alarmInfo = config.alarmInfo;
var str = '';
var near = config.near;
$.getJSON(qxPre, function(data) {
    var str = '';
    if (data.detail.alarms.length == 0) {
        str = "<div class='imgAlarm'><img src = 'resources/img/icon/default.png'></div>"
    }

    $.each(data.detail.alarms, function(index, item) {
        console.log(item)
        str = str + "<li><div class = 'imgTitile'><div class='img'><img src='resources/img/wicon/warning2.png'></div><div class='header'><div class = 'title'>" + item.info + item.levelName + "预警" + "</div><div class='time'>" + item.date + "</div></div></div><div class='content'><p>" + item.description + "</p></div></li>"
    })

    $('.fangxunPre .nodataTip ul').html(str);
});

$('.tab-city').bind('touchstart', function() {
    $('.footer').show()
    getTime();
    urlReq(cityUrl).done(function(data) {
        console.log(data);
        var contant = '.whole-City .cityRain';
        renderList(data, contant);
        $('.loadingBG').hide();
        map = new AMap.Map('map-yuqing', {
            resizeEnable: true
                // zoom: 5,
                // center: [105.397428, 39.90923]
        });
        map.plugin(["AMap.ToolBar"], function() { //加载工具条
            tool = new AMap.ToolBar({
                //offset: new AMap.Pixel(15, 100),
                direction: false,
                locate: false
            });
            map.addControl(tool);
        });

        $('.contBox, .deRainCon').on('click', '.map-icon', function() {
            var $this = $(this);
            console.log(data)
            newMark(data.result.items);
            map.setZoomAndCenter(11, [$this.attr('data-lon'), $this.attr('data-lat')]);
        });

        $('.map-return').on('click', function() {
            $('.map-container').hide();
        });
    }).done(function(data) {
        $('.whole-City ul li').addClass('overFlow');
        $('.whole-City .deRainCon .city-contant .td1').on('tap', function() {
            pioGet(data);
            var text = $(this).text();
            //开始写入chart
            var rain = p[0][text];
            console.log(rain)
            if (rain == 'NULL') {
                console.log('没有值')
            } else {
                $.each(rain, function(index, item) {
                    var rainC = item.precipitationOfTime;
                    var raint = item.timestamp;
                    raint = new Date(raint);
                    m = (raint.getMonth() + 1).toString(), //month
                        d = raint.getDate().toString(), //day
                        h = raint.getHours().toString(), //hour
                        timeArray.push(m + '-' + d + '<br>' + h + ':00');
                    elemArray.push(rainC)
                })
            }
            if (elemArray.length == 0) {
                for (var i = 0; i < 4; i++) {
                    timeArray[i] = timeDefaultArray[i].substring(4, 6) + '-' + timeDefaultArray[i].substring(6, 8) + '<br>' + timeDefaultArray[i].substring(8, 10) + ':' + timeDefaultArray[i].substring(10, 12);
                    elemArray[i] = 0;
                }
            }

            renderChart('.rainContainer');
            showLine(210, 300, '.mask');
            elemArray = [];
            timeArray = [];
            p = [];
        })

    })
})

$('.tab-yudao').bind('touchstart', function() {
    $('.footer').hide()
    urlReq(yudao).done(function(data) {
        renderYudao(data);
        $('.loadingBG').hide()
        $('.whole-zhan ul li').addClass('overFlow');
        $('.whole-zhan ul li').on('tap', function() {
            text = $(this).children().first().text();
            console.log(text);
            urlReq(yudao + '/get?name=' + text).done(function(data) {
                $('.loadingBG').hide();
                countryRenderList(data);
                $('.whole-zhan').hide()
                setTimeout(function() {
                    $('.yudao').show();
                }, 500)
                $('.yudao .quxian-content:eq(0)').show();

                $('.yudao span').eq(0).html(text);
                $('.quxian-content .td1').on('tap', function() {
                    pioGet(data);
                    var text = $(this).text();
                    //开始写入chart
                    var rain = p[0][text];
                    console.log(text)
                    if (rain == 'NULL') {
                        console.log('没有值')
                    } else {
                        $.each(rain, function(index, item) {
                            var rainC = item.precipitationOfTime;
                            var raint = item.timestamp;
                            raint = new Date(raint);
                            m = (raint.getMonth() + 1).toString(), //month
                                d = raint.getDate().toString(), //day
                                h = raint.getHours().toString(), //hour
                                timeArray.push(m + '-' + d + '<br>' + h + ':00');
                            elemArray.push(rainC)
                        })
                    }
                    console.log(timeArray)
                    if (elemArray.length == 0) {
                        for (var i = 0; i < 4; i++) {
                            timeArray[i] = timeDefaultArray[i].substring(4, 6) + '-' + timeDefaultArray[i].substring(6, 8) + '<br>' + timeDefaultArray[i].substring(8, 10) + ':' + timeDefaultArray[i].substring(10, 12);
                            elemArray[i] = 0;
                        }
                    }
                    renderChart('.rainContainer');
                    showLine(210, 300, '.mask');
                    elemArray = [];
                    timeArray = [];
                    p = [];
                })
            })
        })
    })
})

//区县雨情数据渲染
urlReq(countryUrl).done(function(data) {
    getTime();
    $('footer').hide();
    renderSList(data);
    code = getCode(data);
}).done(function() {
    $('.loadingBG').hide();
    $('.quxian ul li').addClass('overFlow');
    $('.quxian ul li').on('tap', function() {
        setTimeout(function() {
            $('.quxian').hide();
        }, 500)
        var index = $(this).index();
        console.log(index);
        text = $(this).children().first().text();
        console.log(text);
        codeNum = code[index][text];
        console.log(codeNum);
        urlReq(codeUrl + codeNum + '/country').done(function(data) {
            map = new AMap.Map('map-yuqing', {
                resizeEnable: true
                    // zoom: 5,
                    // center: [105.397428, 39.90923]
            });
            map.plugin(["AMap.ToolBar"], function() { //加载工具条
                tool = new AMap.ToolBar({
                    //offset: new AMap.Pixel(15, 100),
                    direction: false,
                    locate: false
                });
                map.addControl(tool);
            });

            $('.contBox, .deRainCon').on('tap', '.map-icon', function() {
                var $this = $(this);
                console.log(data)
                newMark(data.result.items);
                map.setZoomAndCenter(11, [$this.attr('data-lon'), $this.attr('data-lat')]);
            });

            $('.map-return').on('click', function() {
                $('.map-container').hide();
            });
            $('.deRainCon .titleTop span').eq(0).html(text);
            var contant = '.quxian-content';
            countryRenderList(data);
            $('.loadingBG').hide();
            $('.rainCon').show();

            $('.rainCon .quxian-content:eq(0)').show();

            $('.quxian-content .td1').on('tap', function() {
                pioGet(data);
                var text = $(this).text();

                //开始写入chart
                var rain = p[0][text];
                console.log(text)
                if (rain == 'NULL') {
                    console.log('没有值')
                } else {
                    $.each(rain, function(index, item) {
                        var rainC = item.precipitationOfTime;
                        var raint = item.timestamp;
                        raint = new Date(raint);
                        m = (raint.getMonth() + 1).toString(), //month
                            d = raint.getDate().toString(), //day
                            h = raint.getHours().toString(), //hour
                            timeArray.push(m + '-' + d + '<br>' + h + ':00');
                        elemArray.push(rainC)
                    })
                }
                console.log(timeArray)
                if (elemArray.length == 0) {
                    for (var i = 0; i < 4; i++) {
                        timeArray[i] = timeDefaultArray[i].substring(4, 6) + '-' + timeDefaultArray[i].substring(6, 8) + '<br>' + timeDefaultArray[i].substring(8, 10) + ':' + timeDefaultArray[i].substring(10, 12);
                        elemArray[i] = 0;
                    }
                }
                renderChart('.rainContainer');
                showLine(210, 300, '.mask');
                elemArray = [];
                timeArray = [];
                p = [];
            })

        });
    })

});
//河道数据渲染
urlReq(river).done(function(data) {
        riveRenderList(data);
        $('.footer').hide();
        $('.hedao .waterOne  .hedao-content .td1').addClass('overFlow')
        $('.loadingBG').hide();
        map = new AMap.Map('map-shuiqing', {
            resizeEnable: true
        });
        map.plugin(["AMap.ToolBar"], function() { //加载工具条
            tool = new AMap.ToolBar({
               //offset: new AMap.Pixel(15, 100),
                direction: false,
                locate: false
            });
            map.addControl(tool);
        });
        $('.contBox').on('click', '.map-icon', function() {
            var $this = $(this);
            newMark(data.result.items);
            map.setZoomAndCenter(9, [$this.attr('data-lon'), $this.attr('data-lat')]);
        });

        $('.map-return').on('click', function() {
            $('.map-container').hide();
        });
        $('.hedao .hedao-content ul .td1').on('tap', function() {
            pioGet(data);
            var text = $(this).text().substring(3, 6);
            var warndischarge = $(this).attr('warndischarge');
            var maxdischarge = $(this).attr('maxdischarge')
            var dischargeNew = $(this).attr('discharge');
            console.log(maxdischarge)
            $('.mask-hedao .num td').eq(0).html(dischargeNew);
            $('.mask-hedao .num td').eq(1).html(warndischarge);
            $('.mask-hedao .num td').eq(2).html(maxdischarge);
            var discharge = p[0][text];
            console.log(discharge)
            if (discharge == 'NULL') {
                console.log('没有值')
            } else {
                $.each(discharge, function(index, item) {
                    var dischargeC = item.discharge;
                    var discharget = new Date(item.timestamp);
                    m = (discharget.getMonth() + 1).toString(), //month
                        d = discharget.getDate().toString(), //day
                        h = discharget.getHours().toString(), //hour
                        timeArray.push(m + '-' + d + '<br>' + h + ':00');
                    elemArray.push(dischargeC)
                })
            }
            if (elemArray.length == 0) {
                for (var i = 0; i < 4; i++) {
                    timeArray[i] = timeDefaultArray[i].substring(4, 6) + '-' + timeDefaultArray[i].substring(6, 8) + '<br>' + timeDefaultArray[i].substring(8, 10) + ':' + timeDefaultArray[i].substring(10, 12);
                    elemArray[i] = 0;
                }
            }
            scaleStep = Math.ceil(elemArray.length / 4);
            renderChart('.waterContainer');
            showLine(270, 300, '.mask-hedao');
            elemArray = [];
            timeArray = [];
            p = [];
        })
    })
    //水库
$('.shuiku-tab-title').bind('touchstart', function() {
    $('.footer').show()
    urlReq(rsvr).done(function(data) {
        $('.shuiku  .nodataTip  .waterTow  .shuiku-contant li').addClass('overFlow')
        map = new AMap.Map('map-shuiqing', {
            resizeEnable: true
        });
        map.plugin(["AMap.ToolBar"], function() { //加载工具条
            tool = new AMap.ToolBar({

                direction: false,
                locate: false
            });
            map.addControl(tool);
        });

        $('.contBox').on('tap', '.map-icon', function() {
            var $this = $(this);
            newMark(data.result.items);
            map.setZoomAndCenter(10, [$this.attr('data-lon'), $this.attr('data-lat')]);
        });

        $('.map-return').on('tap', function() {
            $('.map-container').hide();
        });
        rsvrRenderList(data)
        $('.loadingBG').hide()
        $('.shuiku .shuiku-contant .td1').on('tap', function() {
            pioGet(data);
            var outflowDischarge = $(this).attr('outflowDischarge')
            var inflowDischarge = $(this).attr('inflowDischarge')
            var stage = $(this).attr('stage')
            var stageLimit = $(this).attr('stageLimit');
            var maxStage = $(this).attr('maxStage');
            console.log(maxStage)
            $('.mask-shuiku .legend .num td').eq(1).html(stageLimit);
            $('.mask-shuiku .legend .num td').eq(2).html(maxStage);
            $('.mask-shuiku .legend .num td').eq(0).html(stage);
            $('.mask-shuiku .inWater-num span').html(inflowDischarge);
            $('.mask-shuiku .outWater-num span').html(outflowDischarge);
            var text = $(this).text();
            var discharge = p[0][text];
            console.log(discharge)
            if (discharge == 'NULL') {
                console.log('没有值')
            } else {
                $.each(discharge, function(index, item) {
                    var dischargeC = item.stage;
                    var discharget = new Date(item.timestamp);
                    m = (discharget.getMonth() + 1).toString(), //month
                        d = discharget.getDate().toString(), //day
                        h = discharget.getHours().toString(), //hour
                        timeArray.push(m + '-' + d + '<br>' + h + ':00');
                    elemArray.push(dischargeC)
                })
            }
            if (elemArray.length == 0) {
                for (var i = 0; i < 4; i++) {
                    timeArray[i] = timeDefaultArray[i].substring(4, 6) + '-' + timeDefaultArray[i].substring(6, 8) + '<br>' + timeDefaultArray[i].substring(8, 10) + ':' + timeDefaultArray[i].substring(10, 12);
                    elemArray[i] = 0;
                }
            }
            scaleStep = Math.ceil(elemArray.length / 4);
            console.log(scaleStep)
            $('.legend .num td').eq(0).html(33);
            renderChart('.waterTwoContainer');
            showLine(270, 300, '.mask-shuiku');
            elemArray = [];
            timeArray = [];
            p = [];
        })
    })
})

function renderChart(classChart) {
    var scale = document.documentElement.clientHeight / 667;
    $(classChart).highcharts({
        chart: {
            backgroundColor: {
                linearGradient: [0, 0, 500, 500],
                stops: [
                    [0, 'rgb(72, 184, 238)'],
                    [1, 'rgb(143, 211, 299)']
                ]
            },
            marginTop: 30,
            borderRadius: 5 * scale,
            type: 'line'
        },
        title: {
            text: null
        },
        series: [{
            name: null,
            color: '#ff0000',
            data: elemArray,
            marker: {
                radius: 3,
                symbol: 'circle', //点形状
                fillColor: '#ffffff', //点填充色
            }
        }],
        plotOptions: {
            series: {
                lineWidth: 1.5,
                lineColor: '#ffffff',
                shadow: false,
                borderColor: null,
                //pointPadding: 0,
                groupPadding: 0.1,
                dataLabels: {
                    enabled: true,
                    color: '#ffffff',
                    align: 'left',
                    style: {
                        fontSize: '12px',
                        fontWeight: 'normal',
                        textShadow: false
                    }
                }
            }
        },
        yAxis: {
            lineColor: '#ffffff',
            tickColor: '#ffffff',
            tickWidth: 1,
            tickLength: 4,
            title: {
                text: null
            },
            lineWidth: 1,
            gridLineWidth: 0,
            labels: {
                style: {
                    color: '#ffffff'
                }
            }
        },
        xAxis: {
            categories: timeArray,

            labels: {
                step: scaleStep,
                rotation: 0,
                style: {
                    color: '#ffffff'
                },

            },
            lineColor: '#ffffff',
            tickColor: '#ffffff',
            tickWidth: 1, //刻度线宽度为0
            tickLength: 4, //刻度线长度为0
            // lineWidth: 1,//轴线宽度为1
            title: {
                text: null
            },
            gridLineWidth: 0
        },
        tooltip: {
            enabled: false
        },
        legend: {
            enabled: false
        },
        credits: {
            enabled: false
        },
        exporting: {
            enabled: false
        }
    });
}
var o = [];
var p = [];
var pioGet = function(data) {
    $.each(data.result.items, function(index, item) {
        var name = item.name;
        if (item.records.length == 0) {
            item.records = 'NULL';
        }
        o[name] = item.records;
    })
    p.push(o);
    o = [];
};

function getCode(data) {
    var p = [];
    $.each(data.result.items, function(index, item) {
        var o = [];
        var name = item.name;
        o[name] = item.code;
        p.push(o);
    })
    return p;
};

function renderYudao(data) {
    console.log(data);
    var str = '';
    //console.log(data.result.items);
    var l = Math.ceil(data.result.items.length / 20);

    $('#mo').html(1)
    $("#xiye").empty();
    $("#xiye").html(1);
    $.each(data.result.items, function(index, item) {
        var count;
        var rainy;
        var count = item.count;
        var name = item.valleyName;
        if (item.isRainy == false) {
            rainy = "最近一小时无降雨";
        } else {
            rainy = "最近一小时有降雨";
        }
        str = str + '<li class="clearfix"><div class="huanlu_pic">' + name + '</div><dl class="jiangyu_right"><dt>雨量监测站:' + count + '个</dt><dt>' + rainy + '</dt></dl></li>'
    })
    $('.whole-zhan ul').html(str);
}
//全市降雨data
function renderList(data, contant) {
    var dataNew = [];
    var m = 0;
    var strAll = '';
    var rainArry = [];
    var l = Math.ceil(data.result.items.length / 20);
    $('#mo').html(l);
    $("#xiye").empty();
    $("#xiye").html(1);
    var q = 0;
    //console.log(data.result.items[0]);
    for (var i = 0; i < l; i++) {
        var dataNew = [];
        for (var j = 0 + m; j < m + 20; j++) {
            var d = data.result.items[j];
            dataNew.push(d);
        }
        var str = ''
        $.each(dataNew, function(index, item) {
            var rainCount
            if (item != undefined) {
                var contRain = item.records.length;
                var lon = item.lng;
                var lat = item.lat;
                if (contRain > 0) {
                    rainCount = item.records[item.records.length - 1].precipitationOfTime
                } else {
                    rainCount = 0;
                }
                str = str + "<ul><li class='td1'>" + item.name + "<li class='td2'>" + item.country + "</li><li class='td2'>" + item.rain + "</li><li class='td3'><img class='map-icon' data-lon=" + lon + "\n" + "data-lat=" + lat + "\n" + "src='resources/img/icon/map.png' /></li></ul>"
                rainArry.push(rainCount);
            }

        })
        str = "<div class='city-contant'>" + str + "</div>"
        m = m + 20;
        //console.log(m);
        strAll = strAll + str;
    }
    strAll = "<div class='city-title'><li class='title' style='font-size:0.12rem'>站名</li><li class='title2' style='font-size:0.12rem'>区县</li><li class='title2' style='font-size:0.12rem'>最近一小时雨量</li><li class='title3' style='font-size:0.12rem'>地图</li></div>" + strAll;
    $(contant).html(strAll);
    $('.city-contant').hide();
    $('.city-contant:eq(0)').show();

};
//区县分类data
function renderSList(data) {
    var str = '';
    //console.log(data.result.items);
    var l = Math.ceil(data.result.items.length / 20);
    console.log(l);
    $.each(data.result.items, function(index, item) {
        var count;
        var rainy;
        var count = item.count;
        var name = item.name;
        if (item.isRainy == false) {
            rainy = "最近一小时无降雨";
        } else {
            rainy = "最近一小时有降雨";
        }
        str = str + '<li class="clearfix"><div class="huanlu_pic">' + name + '</div><dl class="jiangyu_right"><dt>雨量监测站:' + count + '个</dt><dt>' + rainy + '</dt></dl></li>'
    })
    $('.quxian ul').html(str);
}
//三个变量分页的Data
function countryRenderList(data) {
    var rainArry = [];
    var dataNew = [];
    var m = 0;
    var l = Math.ceil(data.result.items.length / 20);
    console.log(l);
    if (l == 1) {
        $('.footer').hide();
    } else {
        $('.footer').show();
        $("#xiye").empty();
        $("#xiye").html(1);
        $('#mo').html(l);
    }

    var strAll = '';
    var q = 0;
    //console.log(data.result.items[0]);
    for (var i = 0; i < l; i++) {
        var dataNew = [];
        for (var j = 0 + m; j < m + 20; j++) {
            var d = data.result.items[j];
            dataNew.push(d);
        }
        //console.log(dataNew)
        var str = ''
            //console.log(dataNew);
        $.each(dataNew, function(index, item) {
            var rainCount
            if (item != undefined) {
                var contRain = item.records.length;
                var lon = item.lng;
                var lat = item.lat;
                if (contRain > 0) {
                    rainCount = item.records[item.records.length - 1].precipitationOfTime
                    if (rainCount != 'NULL') {
                        rainArry.push(rainCount);
                    }
                } else {
                    rainCount = 0;
                }

                str = str + "<ul><li class='td1'>" + item.name + "</li><li class='td2'>" + item.rain + "</li><li class='td3'><img class='map-icon' data-lon=" + lon + "\n" + "data-lat=" + lat + "\n" + "src='resources/img/icon/map.png' /></li></ul>"
            }
        })
        str = "<div class='quxian-content'>" + str + "</div>"
        m = m + 20;
        strAll = strAll + str;
    }
    strAll = "<div class='quxian-title'><li class='title'  style='font-size:0.14rem'>站名</li><li class='title2' style='font-size:0.14rem'>最近一小时雨量</li><li class='title3'  style='font-size:0.14rem'>地图</li></div>" + strAll;
    $('.deRainCon  .water').html(strAll);
    $('.quxian-content').hide()
}
//河道数据渲染
function riveRenderList(data) {
    console.log(data.result.items.length)
    var strAll = '';
    var str = ''
    $.each(data.result.items, function(index, item) {
        var discharge
        if (item != undefined) {
            var contRain = item.records.length;
            var lon = item.lng;
            var lat = item.lat;
            if (contRain > 0) {
                discharge = item.records[item.records.length - 1].discharge
            } else {
                discharge = 0;
            }
            str = str + "<ul><li class='td1'" + "warnDischarge=" + item.warnDischarge + "\n" + "discharge=" + discharge + "\n" + "maxDischarge=" + item.maxDischarge + ">" + item.riverName + '·' + item.name + "</li><li class='td2'>" + discharge + "</li><li class='td3'><img class='map-icon' data-lon=" + lon + "\n" + "data-lat=" + lat + "\n" + "src='resources/img/icon/map.png' /></li></ul>"
        }
    })
    str = "<div class='hedao-content'>" + str + "</div>"
    strAll = strAll + str;
    strAll = "<div class='hedao-title'><li class='title'>站名</li><li class='title2'>流量(m³/s)</li><li class='title3'>地图</li></div>" + strAll;
    $('.waterOne').html(strAll);
    $('.hedao-content').hide();
    $('.hedao-content:eq(0)').show();
}
//水库数据渲染 
function rsvrRenderList(data) {
    var dataNew = [];
    var m = 0;
    var strAll = '';
    var l = Math.ceil(data.result.items.length / 20);
    $('#mo').html(l);
    var q = 0;
    for (var i = 0; i < l; i++) {
        var dataNew = [];
        for (var j = 0 + m; j < m + 20; j++) {
            var d = data.result.items[j];
            dataNew.push(d);
        }
        var str = ''
        $.each(dataNew, function(index, item) {
            var limitstage;
            var stage;
            if (item != undefined) {
                var cont = item.records.length;
                var lon = item.lng;
                var lat = item.lat;
                var limitstage = item.stageLimit;
                var outflowDischarge = "--";
                var inflowDischarge = "--"
                if (limitstage == null) {
                    limitstage = '--';
                }
                if (cont > 0) {
                    stage = item.records[item.records.length - 1].stage;
                    outflowDischarge = item.records[item.records.length - 1].outflowDischarge;
                    inflowDischarge = item.records[item.records.length - 1].inflowDischarge
                } else {
                    stage = 0;
                }
                str = str + "<ul><li class='td1 overFlow'" + "maxStage=" + item.maxStage + "\n" + "inflowDischarge=" + inflowDischarge + "\n" + "stage = " + stage + "\n" + "outflowDischarge=" + outflowDischarge + "\n" + "stageLimit=" + item.stageLimit + ">" + item.name + "<li class='td2'>" + stage + "</li><li class='td2'>" + limitstage + "</li><li class='td3'><img class='map-icon' data-lon=" + lon + "\n" + "data-lat=" + lat + "\n" + "src='resources/img/icon/map.png' /></li></ul>"
                console.log(item.inflowDischarge);
                $('.waterNum .inWater-num span').html(item.inflowDischarge);
                $('.waterNum .outWater span').html(item.outflowDischarge)
            }
        })

        str = "<div class='shuiku-contant'>" + str + "</div>"
        m = m + 20;
        strAll = strAll + str;
    }
    strAll = "<div class='shuiku-title'><li class='title'>站名</li><li class='title2'>水位(m)</li><li class='title2'>汛限水位(m)</li><li class='title3'>地图</li></div>" + strAll;
    $('.waterTow').html(strAll);
    $('.shuiku-contant').hide();
    $('.shuiku-contant:eq(0)').show();

}
$('.near-title').bind('touchstart', function() {
    var str = "";
    urlReq(near).done(function(data) {
        if (data.result.count == 0) {
            str = "<div class='imgAlarm'><img src = 'resources/img/icon/default.png' style='height:1.64rem ;width:2.65rem'></div>"
            $('.fangxunClose').html("hh");
        } else {
            $.each(data.result.items, function(index, item) {
                str = str + "<div class = 'content'><p>西安防汛</p><p>" + item.warning + "</p></div>"
            })

        }
        $('.fangxunClose').html(str);
    })
})
urlReq(flood).done(function(data) {
    var str = '';
    if (data.result.count == 0) {
        str = "<div class='imgAlarm' ><img src = 'resources/img/icon/default.png' style='height:1.64rem ;width:2.65rem'></div>"
    } else {
        $.each(data.result.pptn, function(index, item) {
            console.log(item)
            var preValue = '';
            if ((item.warnValue > 30) && (item.warnValue < 50)) {
                preValue = '大暴雨';
            }
            if (item.warnValue > 50) {
                preValue = '特大暴雨';
            }
            str = str + '<li><div class="aLeft"><div class="title">' + item.countryName + item.valleyName + '山洪预警' + '</div></div><div class="aRight"><img src="resources/img/icon/arrow_down.png"></div></li><div class="content"><p>' + item.countryName + item.valleyName + preValue + '过去1小时降雨量达到' + preValue + '级别，发生山洪泥石流可能性较大，请远离河道，迅速转移到安全地带。' + '</p></div><li></li>'
        })
        $.each(data.result.river, function(index, item) {
            str = str + '<li><div class="aLeft"><div class="title">' + item.riverName + '超警戒流量预警' + '</div><div class="time"></div></div><div class="aRight"><img src="resources/img/icon/arrow_down.png"></div></li><div class="content"><p>' + time('yyyy-MM-dd-hh-mm', 0, item.fireTime) + item.riverName + '断面出现超警戒洪水，请广大市民注意天气变化，选择较安全地带停留，远离河道，以防危险。' + '</p></div><li></li>'
        })
        $.each(data.result.rsvr, function(index, item) {
            str = str + '<li><div class="aLeft"><div class="title">' + item.countryName + item.reservoirName + '库超汛限预警' + '</div><div class="time"></div></div><div class="aRight"><img src="resources/img/icon/arrow_down.png"></div></li><div class="content"><p>' + item.countryName + item.reservoirName + '水库' + '于' + time('yyyy-MM-dd-hh-mm', 0, item.fireTime) + item.riverName + '时间超出汛限水位，随时可能泄洪，请广大市民注意天气变化，远离水库，远离河道，以防危险' + '</p></div><li></li>'
        })
    }
    $('.shAlarm  ul').html(str);
    $('.sh .content').hide();
    $('.sh .aRight').on('touchstart', function() {
        if ($(this).parent().next('.content').is(":hidden")) {
            $(this).parent().next('.content').show();
            $(this).children().attr('src', "resources/img/icon/arrow_up.png");
        } else {
            $(this).parent().next('.content').hide();
            $(this).children().attr('src', "resources/img/icon/arrow_down.png");
        }
    });
})
$('.yubao-title').bind('touchstart', function() {
    urlReq(valleyGet).done(function(data) {
        var str = "";
        if (data.result.count == 0) {
            str = "<div class='imgAlarm' style='text-align:center'><img src = 'resources/img/icon/default.png' style='height:1.64rem ;width:2.65rem'></div>"
        } else {
            $.each(data.result.item, function(index, item) {
                str = str + '<li>' + item.countryName + item.valleyName + '未来两小时会有大雨（暴雨）的雨情发生，请广大市民注意天气变化，远离水库，远离河道，以防危险。' + '</li>'
            })
        }
        $('.shPre').html(str);
    })
})
$(".tabCont").not(":first").hide();
$(".tabTitle li").bind('touchstart', function() {
    $(this).addClass('current').siblings('li').removeClass('current');
    var index = $(".tabTitle li").index($(this));
    $(".tabCont").eq(index).fadeIn().siblings(".tabCont").hide();
});
$('.sh .content').hide();
$('.mask').hide();
$('.chart img').bind('touchstart', function() {
    setTimeout(function() {
        $('.mask').hide();
    }, 500)
})
$('.rainCon').hide();
$('.yudao').hide()
$('.fuTitle').bind('touchstart', function() {
    $('.rainCon').hide();
})
$('.rainCon .titleTop span ').bind('touchstart', function() {
    $('.rainCon').hide();
    setTimeout(function() {
        $('.tabCont').eq(0).show();
    }, 500)
    $("#xiye").empty();
    $("#xiye").html(1);
    $('#mo').html(1);
})
$('.yudao .titleTop span ').bind('touchstart', function() {
    $('.yudao').hide();
    setTimeout(function() {
        $('.tabCont').eq(2).show();
    }, 500)
    $("#xiye").empty();
    $("#xiye").html(1);
    $('#mo').html(1);
})

function newMark(data) {
    map.clearMap(); // 清除地图覆盖物
    var records = data;
    var markers = [];
    var marsCoordinate = [];
    var scale = document.documentElement.clientHeight / 667;

    for (var i = 0, len = records.length; i < len; i++) {
        marsCoordinate = coordtransform.wgs84togcj02(records[i].lng, records[i].lat);
        markers.push({
            content: '<div class="bubble"><img src="resources/img/icon/pin.png" class="bubble-pin"><div class="bubble-box"><span class="bubble-name">' + records[i].name + '</span><span class="bubble-value">' + records[i].count + '</span></div></div>',
            position: marsCoordinate
        });
    }

    markers.forEach(function(marker) {
        new AMap.Marker({
            map: map,
            content: marker.content,
            position: [marker.position[0], marker.position[1]],
            offset: new AMap.Pixel(-12 * scale, -36 * scale)
        });
    });
    $('.map-container').show();
}

$('.tab-county,.tab-city,.tab-yudao,.shuiku-tab-title').bind('touchstart', function() {
    $("#xiye").empty();
    $("#xiye").html(1);

})
$('.hedao-tab-title ,.tab-county').bind('touchstart', function() {
    $('.footer').hide()
})
$('.tab-county').bind('touchstart', function() {
    $("#xiye").empty();
    $("#xiye").html(1);
    $('#mo').html(1);
})
var scaleV = document.documentElement.clientHeight / 667;
$('video').css('width', 320 * scaleV);
$('video').css('height', 240 * scaleV);
$('object').css('width', 320 * scaleV);
$('object').css('height', 240 * scaleV);
