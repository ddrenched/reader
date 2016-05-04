/**
 * Created by willli on 16/4/30.
 */
(function(){

    var Util = (function(){
        //为Key添加一个前缀prefix,避免变量冲突
        var prefix = 'html_reader_';
        //设置localStorage本地存取
        var StorageGetter = function(key){
            return localStorage.getItem(prefix + key);
        };
        var StorageSetter = function(key, val){
            return localStorage.setItem(prefix + key, val);
        };
        var getBSONP = function(url, callback){
            return $.jsonp({
                url: url,
                cache: true,
                callback: 'duokan_fiction_chapter',
                success: function(result){
                    var data = $.base64.decode(result);
                    var json = decodeURIComponent(escape(data));
                    callback(json);
                }
            })
        };
        //将数据暴露
        return {
            getBSONP: getBSONP,
            StorageGetter: StorageGetter,
            StorageSetter: StorageSetter
        }
    }());

    //缓存需要操作的DOM,window对象,document对象
    var Dom = {
        mid_action: $('#mid_action'),
        top_nav: $('#top_nav'),
        bottom_nav: $('#bottom_nav'),
        font_button: $('#font_button'),
        night_button: $('#night_button'),
        font_container: $('#font_container'),
        large_button: $('#large_button'),
        small_button: $('#small_button'),
        fiction_container: $('#fiction_container'),
        body: $('#body'),
        color_container: $('#color_container'),
        prev_button: $('#prev_button'),
        next_button: $('#next_button')
    };
    var win = $(window);
    var doc = $(document);
    var readerModel;
    var readerUI;

    //取出HTML5本地存储中的字体大小,如果则没有设置为14
    var initialFontSize = parseInt(Util.StorageGetter('font-size'));
    initialFontSize = initialFontSize || 14;
    Dom.fiction_container.css('font-size', initialFontSize);

    //取出HTML5本地存储中的背景颜色,如果没有则设置为rgb(233, 233, 199)
    var initialBkColor = Util.StorageGetter('background-color');
    initialBkColor = initialBkColor || 'rgb(233, 233, 199)';
    Dom.body.css('background-color', initialBkColor);

    //控制背景颜色时,将被代理的子元素的标识符(className的最后一位)存入下面这个变量中
    var class_name;

    //整个项目的入口函数
    function main(){
        readerModel = ReaderModel();
        readerUI = ReaderBaseFrame(Dom.fiction_container);
        readerModel.init(function(data){
            readerUI(data);
        });
        EventHandler();
    }

    //实现和阅读器相关的数据交互方法
    function ReaderModel(){
        var Chapter_id;
        var Chapter_total;
        var init = function(UIcallback){
            getFictionInfo(function(){
                getCurChapterContent(Chapter_id, function(data){
                    //将内容交互到UI层
                    UIcallback && UIcallback(data);
                });
            });
        };
        //获得章节信息(chapter.json)
        var getFictionInfo = function(callback){
            $.get('chapter.json', function(data){
                //获得章节信息后的回调
                Chapter_id = data.chapters[1].chapter_id;
                Chapter_total = data.chapters.length;
                callback && callback();
            }, 'json');
        };
        //获得章节内的小说的url(dataX.json)
        var getCurChapterContent = function(chapter_id, callback){
            $.get('data' + chapter_id + '.json', function(data){
                //如果服务器正常,取出url
                if(data.result == 0){
                    var url = data.jsonp;
                    Util.getBSONP(url, function(data){
                        callback && callback(data);
                    });
                }
            }, 'json');
        };
        //上一章
        var prevChapter = function(UIcallback){
            Chapter_id = parseInt(Chapter_id, 10);
            if(Chapter_id == 0){
                return;
            }
            Chapter_id = Chapter_id - 1;
            getCurChapterContent(Chapter_id, UIcallback)
        };
        //下一章
        var nextChapter = function(UIcallback){
            Chapter_id = parseInt(Chapter_id, 10);
            if(Chapter_id == Chapter_total){
                return;
            }
            Chapter_id = Chapter_id + 1;
            getCurChapterContent(Chapter_id, UIcallback)
        };
        return {
            init: init,
            prevChapter: prevChapter,
            nextChapter: nextChapter
        }
    }

    //渲染基本UI结构
    function ReaderBaseFrame(container){
        function parseChapterData(jsonData){
            //解析章节数据
            var jsonObj = JSON.parse(jsonData);
            var html = '<h4>' + jsonObj.t + '</h4>';
            for(var i = 0; i < jsonObj.p.length; i++){
                html += '<p>' + jsonObj.p[i] + '</p>';
            }
            return html;
        }
        return function(data){
            container.html(parseChapterData(data));
        }
    }

    //与用户的交互事件绑定
    function EventHandler(){
        //触碰唤出/隐藏上下导航
        Dom.mid_action.click(function(){
            if(Dom.top_nav.css('display') == 'none'){
                Dom.top_nav.show();
                Dom.bottom_nav.show();
            }else{
                Dom.top_nav.hide();
                Dom.bottom_nav.hide();
                Dom.font_container.hide();
            }
        });
        //滚动隐藏上下导航/字体面板
        win.scroll(function(){
            Dom.top_nav.hide();
            Dom.bottom_nav.hide();
            Dom.font_container.hide();
        });
        //触碰唤出字体面板
        Dom.font_button.click(function(){
            if(Dom.font_container.css('display') == 'none'){
                Dom.font_container.show();
            }else{
                Dom.font_container.hide();
            }
        });
        //控制字体大小
        Dom.large_button.click(function(){
            if(initialFontSize < 20){
                initialFontSize += 1;
            }
            Dom.fiction_container.css('font-size', initialFontSize);
            //将字体大小存储在HTML5本地存储中
            Util.StorageSetter('font-size', initialFontSize);
        });
        Dom.small_button.click(function(){
            if(initialFontSize > 10){
                initialFontSize -= 1;
            }
            Dom.fiction_container.css('font-size', initialFontSize);
            Util.StorageSetter('font-size', initialFontSize);
        });
        //控制背景颜色
        Dom.color_container.on('click','.bk-color', function(e){
            class_name = parseInt(e.target.className.toString().slice(-1));
            var switch_key = $('.bk-color' + class_name);
            switch(class_name){
                case 1:
                    initialBkColor = 'rgb(245, 234, 222)';
                    Dom.body.css('background-color', initialBkColor);
                    //将背景颜色存储在HTML5本地存储中
                    Util.StorageSetter('background-color', initialBkColor);
                    //设置边框
                    switch_key.css('border', '1px solid #ff6600').siblings().css('border', '1px solid #000');
                    break;
                case 2:
                    initialBkColor = 'rgb(233, 233, 199)';
                    Dom.body.css('background-color', initialBkColor);
                    Util.StorageSetter('background-color', initialBkColor);
                    switch_key.css('border', '1px solid #ff6600').siblings().css('border', '1px solid #000');
                    break;
                case 3:
                    initialBkColor = 'rgb(147, 147, 147)';
                    Dom.body.css('background-color', initialBkColor);
                    Util.StorageSetter('background-color', initialBkColor);
                    switch_key.css('border', '1px solid #ff6600').siblings().css('border', '1px solid #000');
                    break;
                case 4:
                    initialBkColor = 'rgb(194, 238, 194)';
                    Dom.body.css('background-color', initialBkColor);
                    Util.StorageSetter('background-color', initialBkColor);
                    switch_key.css('border', '1px solid #ff6600').siblings().css('border', '1px solid #000');
                    break;
                case 5:
                    initialBkColor = 'rgb(30, 39, 56)';
                    Dom.body.css('background-color', initialBkColor);
                    Util.StorageSetter('background-color', initialBkColor);
                    switch_key.css('border', '1px solid #ff6600').siblings().css('border', '1px solid #000');
                    break;
            }
        });
        //控制夜间模式
        Dom.night_button.click(function(){
            if(Dom.body.css('background-color') == 'rgb(233, 233, 199)'){
                Dom.body.css('background-color', 'rgb(30, 39, 56)');
            }else{
                Dom.body.css('background-color', 'rgb(233, 233, 199)');
            }
        });
        //上/下章节
        Dom.prev_button.click(function(){
            readerModel.prevChapter(function(data){
                readerUI(data);
            });
        });
        Dom.next_button.click(function(){
            readerModel.nextChapter(function(data){
                readerUI(data);
            });
        });
    }

    main();

}());
