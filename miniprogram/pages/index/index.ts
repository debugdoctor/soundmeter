// index.ts
// 获取应用实例
const app = getApp<IAppOption>()
const recorderManager = wx.getRecorderManager()
const fs = wx.getFileSystemManager()
var base = require('../../base.js'); 
const _ = base._; 
let level:Array<string>=[]

let options = {
  duration:600000 as any,
  sampleRate: 12000 as any,
  numberOfChannels: 2 as any,
  encodeBitRate: 24000 ,
  format: 'PCM' as any,
  frameSize: 46.560+46.560/4
}

let options2 = {
  duration:600000 as any,
  sampleRate: 12000 as any,
  numberOfChannels: 2 as any,
  encodeBitRate: 24000 ,
  format: 'PCM' as any,
  frameSize: 46.560/8*5
}

let options3 = {
  duration:600000 as any,
  sampleRate: 12000 as any,
  numberOfChannels: 2 as any,
  encodeBitRate: 24000 ,
  format: 'PCM' as any,
  frameSize: 46.560/2*3
}

function audio2db (buffer_ori:ArrayBuffer,size:any):string{
  var sum=0
  var buffer=new Int16Array(buffer_ori)
  for(var i=12000;i<size/2;i++){ //4800 frame values from the begining may be zero 
    sum+=Math.abs(buffer[i])
  }
  var db=20*Math.log10(sum/(size/2-12000))
  return db.toFixed(2)
}

function arr2str(arr:Array<string>,duration:number):string{
  var sum:string="time:s,level:db\n"
  var time=duration/1000
  arr.forEach(element => {
    sum+=time.toFixed(1)+','+element+"\n"
    time+=duration/1000
  });
  return sum
}


Page({
  data: {
    motto: '0.00',
    button1:'Start',
    button2:'Export CSV',
    inter:0, //corn
    realtime:false, //is or not realtime pattern
    mutex:false, // start and stop mutex
    isout:false, // is slow or fast every result has been displayed
    buffer:new ArrayBuffer(0), //buffer for level
    duration:5000,

    translator:{},

    radioItems: [
      {name: 'Real Time', value: 'realtime', checked: true},
      {name: 'Fast Mode', value: 'fast', checked: false},
      {name: 'Slow Mode', value: 'slow', checked: false}
    ],

    },

    /* event respond*/

    onShareAppMessage() {
      return {
        title: 'radio',
        path: 'page/component/pages/radio/radio'
      }
    },

    radioChange(e: { detail: { value: string } }) {
      const items = this.data.radioItems
      for (let i:number = 0; i < this.data.radioItems.length; i++) {
          items[i].checked = (items[i].name===e.detail.value)
      }
      this.setData({items})
    },

    bindKeyInput: function (e: { detail: { value: any } }) {
      if(e.detail.value<3000){
        this.setData({
          inputValue: 5000
        })
      }
      this.setData({
        inputValue: e.detail.value
      })
    },
    

    /* init recorder*/
    onLoad:function(){
      this.langOnLoad()

      recorderManager.onStart(() => {
      })
  
      recorderManager.onError((res)=>{
        console.info(res.errMsg)
      })

      recorderManager.onFrameRecorded((res) => {
        if(this.data.realtime==true){
          var db=audio2db(res.frameBuffer,res.frameBuffer.byteLength)
          console.log("buffer length",res.frameBuffer.byteLength/2)
          this.setData({
            motto: db,
          })
        }else{
          if(this.data.isout==false){
            var db=audio2db(res.frameBuffer,res.frameBuffer.byteLength)
            console.log("buffer length",res.frameBuffer.byteLength/2)
            level.push(db)
            this.setData({
              motto: db,
              isout:true
            })
          }
        }
      })

    recorderManager.onStop((res)=>{
      console.log("duration",res.duration)
        this.setData({
          isout:false
        })
    })
  },

  /*corn job*/
  startInter : function(option: any,balance:number,duration:number){
    var that = this;
    that.data.inter= setInterval(
        function () {
          recorderManager.start(option)
          setTimeout(()=>{
            recorderManager.stop()
          },balance)
          console.log('setInterval 执行一次任务')
        }, duration);    
  },

  endInter: function(){
    var that = this;
    clearInterval(that.data.inter)
    recorderManager.stop()
  },
  onUnload: function () {
    this.endInter()
  },

  /* translation */
  langOnLoad: function () {
    this.setData({
      translator: base._t(), 
    });
  },

  /*different funtion*/
  soundmeter(){
    if(this.data.radioItems[0].checked){
      if(this.data.mutex==false){
        console.info("Start")
        recorderManager.start(options)
        this.setData({
          button1:'Stop',
          mutex:true,
          realtime:true
        })
      }
      else{
        console.info("Stop")
        recorderManager.stop()
        this.setData({
          button1:'Start',
          mutex:false
        })
      }
    }
    else{
      if(this.data.radioItems[1].checked){
        if(this.data.mutex==false){
          level=[]
          console.info("start fast",options2.frameSize)
          this.startInter(options2,625,this.data.duration)
          this.setData({
            button1:'Stop',
            mutex:true,
            realtime:false
          })
        }else{
          console.info("Stop")
          this.endInter()
          this.onUnload()
          this.setData({
            button1:'Start',
            mutex:false
          })
        }
      }else{
        if(this.data.mutex==false){
          level=[]
          console.info("start slow")
          this.startInter(options3,1500,this.data.duration)
          this.setData({
            button1:'Stop',
            mutex:true,
            realtime:false
        })
      }else{
        console.info("Stop")
        this.endInter()
        this.onUnload()
        this.setData({
          button1:'Start',
          mutex:false
        })
       }
    }
    }
  },

  /* export csv */
  export(){
    if(this.data.radioItems[0].checked){
      wx.showModal({
        title: '提示',
        content: 'realtime mode cannot export file',
        success (res) {
          if (res.confirm) {
            console.log('用户点击确定')
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
    }
    this.filesaving()
  },

  /*save file to local*/
  filesaving(){
    fs.writeFile({
      filePath: `${wx.env.USER_DATA_PATH}/test.csv`,
      data: arr2str(level,this.data.duration),
      encoding: 'utf8',
      success(res) {
        console.log(res)
      },
      fail(res) {
        console.error(res)
      }
    })
    wx.openDocument({
      filePath: `${wx.env.USER_DATA_PATH}/test.csv`,
      success: function () {
        console.log('open file success')
      }
    })
  }
})


