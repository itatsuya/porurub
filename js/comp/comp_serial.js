const decoder = new TextDecoder("utf-8");

Vue.component('serial-console', {
    mixins: [mixins_bootstrap],
    props: ["console"],
    template: `
  <div>
    <div v-if="console_visible">
      <div class="row" v-if="!connected">
        <button class="btn btn-secondary col-auto" v-on:click="connect()">Connect</button>
        <label class="title col-auto">baudrate:</label>
        <span class="col-auto">
          <select v-if="!connected" class="form-select" v-model.number="baud">
            <option value="9600">9600</option>
            <option value="57600">57600</option>
            <option value="115200">115200</option>
            <option value="230400">230400</option>
            <option value="921600">921600</option>
          </select>
        </span>
      </div>
      <button v-if="connected" class="btn btn-secondary" v-on:click="disconnect()">Disconnect</button>
      <label class="title"> connected:</label> {{connected}}
      <button class="btn btn-secondary btn-sm float-end" v-on:click="close_console">x</button>
      <button class="btn btn-secondary btn-sm float-end" v-on:click="text_clear">clear</button>
      <span class="float-end"><input type="checkbox" v-model="auto_scroll" id="auto_scroll"><label for="auto_scroll">auto-scroll</label>&nbsp;</span>
      <textarea class="form-control" style="height: 70vh" id="el" readonly>{{console_text}}</textarea>
    </div>
    <div v-else>
    	<br>
        <button class="btn btn-secondary btn-sm float-end" v-on:click="open_console">o</button>
    </div>
  </div>`,
    data: function () {
      return {
          console_text: "",
          connected: false,
          auto_scroll: true,
          baud: 115200,
          console_visible: this.console
      }
    },
    methods: {
      /* シリアル */
      close_console: function(){
          this.disconnect();
          this.console_visible = false;
      },
      open_console: function(){
            this.console_visible = true;
      },
          connect: async function(enable){
              try{
                  await this.disconnect();
              }catch(error){}
  
              try{
                  var port = await navigator.serial.requestPort();
                  await port.open({ baudRate: this.baud });
                  this.port = port;
                  this.connected = true;
                  this.console_text += "[[connected]]\n";
                  this.receiveLoop();
              }catch(error){
                  console.log(error);
                  alert(error);
              }
          },
  
          disconnect: async function(){
              if( this.port ){
                  if( this.reader )
                      await this.reader.cancel();
                  await this.port.close();
                  this.port = null;
              }
              this.connected = false;
          },
  
          data_process: function(value){
              this.console_text += decoder.decode(value);
              if( this.auto_scroll ){
                const el = document.getElementById('el');
                el.scrollTo(0, el.scrollHeight);
              }
          },
  
          receiveLoop: async function(){
              if( !this.port || !this.port.readable )
                  throw 'port status invalid';
  
              this.reader = this.port.readable.getReader();
              return new Promise(async (resolve, reject) =>{
                  do{
                      try{
                          var { value, done } = await this.reader.read();
                          if( done ){
                              this.console_text += '[[read done detected]]\n';
                              this.connected = false;
  //                            this.disconnect();
                              return reject("read done detected");
                          }
                          this.data_process(value);
                      }catch(error){
                        console.log(error);
                        this.connected = false;
                        this.console_text += '[[throw exception]]\n';
                        return reject(error);
                      }
                  }while(true);
              })
              .catch(error =>{
                  console.log(error);
              });
          },
          text_clear: function(){
              this.console_text = "";
          }
    }
  });

export default {
  mixins: [mixins_bootstrap],
  template: `
<div>
  <h2 class="modal-header">シリアル</h2>
  <table class="table table-borderless">
    <tbody>
        <tr>
            <td v-for="(item, index) in views">
                <serial-console v-bind:console="item"></serial-console>
            </td>
        </tr>
    </tbody>
  </table>
</div>`,
  data: function () {
    return {
        views: [true, false, false]
    }
  },
  methods: {
  }
};
