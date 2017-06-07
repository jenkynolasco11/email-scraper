(function(global){
  
  function format_size(size, i) {
    
    var i = i || 0,
        prefix = ['BYTES', 'KB', 'MB', 'GB', 'TB', 'PB'];
    
    if (size > 1024) {
      return format_size(size / 1024, i + 1);
    }
    
    return size.toFixed(2) + prefix[i];
  }
  
  function format_time(ms, prefix) {
    
    var str = '', tmp, seconds = Math.floor(ms / 1000);
    
    if (seconds < 3600) {
      
      str = (seconds % 60) + 's';
      
    }
    
    tmp = Math.floor(seconds / 60);
    if (tmp > 0) {str = (tmp%60) + 'm ' + str;}
    
    tmp = Math.floor(seconds / (60*60));
    if (tmp > 0) {str = (tmp%24) + 'h ' + str;}
    
    tmp = Math.floor(seconds / (60*60*24));
    if (tmp > 0) {str = (tmp) + 'd ' + str;}
    
    return str;
    
  }
  
  function machine_list(workers) {
    
    var list_thread = function(worker, id, pid) {
      var download_info = worker.stats.network.download;
      var download_label = "Parsing...";
      
      if (download_info.error) {
        download_label = 'Retrying Download...';
      } else if (download_info.downloaded != download_info.total) {
        download_label = format_size(download_info.downloaded) + '/' + format_size(download_info.total);
      }
      
      return '' +
      '<div class="row thread thread-'+(worker.is_active ? 'online' : 'offline')+'">' +
      '<div class="col-md-4">' +
      'Thread #' + pid +
      '</div>' +
      '<div class="col-md-8 text-right">' +
      download_label +
      '</div>' +
      '</div>';
    }
    
    var list_machine = function(workers, id) {
      var str = '', cpu, thread, ram;
      
      for(pid in workers) {
        cpu = workers[pid].stats.cpu.name;
        ram = workers[pid].stats.cpu.ram;
        thread = workers[pid].stats.cpu.cores;
        
        str += list_thread(workers[pid], id, pid);
      }
      
      return '' +
      '<h1 class="section">Machine #' + id + '</h1>' +
      '<div class="row">' +
      '<div class="col-md-6">' + 
      
      '<label>Processor</label>: ' + cpu + '<br>' +
      '<label>Threads</label>: ' + thread + '<br>' +
      '<label>RAM</label>: ' + ram + 'GB<br>' +
      
      '</div>' +
      '<div class="col-md-6">' + 
      '' + str +
      '</div>' +
      '</div>';
      
    };
    
    var html = '';
    
    for(id in workers) {
      html += list_machine(workers[id], id);
    }
    
    $('#machines').html(html);
    
  }
  
  function stats_refresh() {
    $.ajax({url: '/status', method: 'POST'}).then(function(data){
      
      // Local variables
      var tmp, percentage;
      
      // Crawler status
      $('#urls-processed').html(data.stats.urls.processed);
      $('#urls-total').html(data.stats.urls.total);
      
      percentage = 100 * (data.stats.urls.processed / data.stats.urls.total)
      $('#urls-total-percent').html("("+percentage.toFixed(2)+"%)");
      
      $('#emails-processed').html(data.stats.emails.processed);
      $('#emails-total').html(data.stats.emails.total);
      
      $('#total-bytes').html(format_size(data.stats.crawls.total_bytes_processed));
      
      $('#crawl-time-total').html(format_time(data.stats.crawls.total_time));
      $('#crawl-time-avg').html(format_time(data.stats.crawls.avg_per_crawl));
      
      tmp = data.stats.crawls.avg_per_crawl * (data.stats.urls.total - data.stats.urls.processed);
      $('#crawl-time-remain').html(format_time(tmp));
      
      // Bandwidth
      $('#bandwidth-usage').html(format_size(data.stats.network.total_bandwidth));
      
      // Machine info
      $('#processor-name').html(data.stats.cpu.name);
      $('#core-count').html(data.stats.cpu.cores);
      $('#ram-amount').html(data.stats.cpu.ram);
      
      // $('#workers-total').html(data.workers.local);
      
      // Machine List
      machine_list(data.stats.workers);
      
    });
  }
  
  $(document).ready(function(){
    if ($('#search-form').length)
    {
      $('#search-form').submit(function(e){
        $.ajax({url: '/search', method: 'POST'}).then(function(data){
          for(var i = 0; i < data.results.length; i++) {           
            /*<div class="col-md-2">First Name</div>
            <div class="col-md-2">Last Name</div>
            <div class="col-md-2">Email</div>
            <div class="col-md-6">URL</div>*/
          }
        });
        
        e.preventDefault();
        e.stopPropagation();
      })
    }
    else
    {
      stats_refresh();
      setInterval(stats_refresh, 5000);
    }
  });
  
})(window);