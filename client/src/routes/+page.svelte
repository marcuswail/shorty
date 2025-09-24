<script>

  let textArea1;
  let textArea2;
  let longUrl = ''; //testo, che si aggiorna in automatico quando scriviamo grazie al bind:value
  let shortUrl = '';
  let generateShortUrl = '';
  let longUrlReceived = '';
  let loading1 = false; // se stiamo elaborando
  let loading2 = false; // se stiamo elaborando
  let showOptions = false;
  let expireEnabled = false; // toggle per expire after 24h
  
  // ridimensiona in automatico la textarea
  function autoResize() {
    if (textArea1) {
      textArea1.style.height = 'auto';
      textArea1.style.height = textArea1.scrollHeight + 'px';
    }
    if (textArea2) {
      textArea2.style.height = 'auto';
      textArea2.style.height = textArea2.scrollHeight + 'px';
    }
  }

  async function handleSubmitShorten() {
    loading1 = true;
    console.log('longUrl:', longUrl);
    
    // fake loading1
    setTimeout(() => {
      loading1 = false;
    }, 500);

    try {
      let body;
      if (expireEnabled){
        body = JSON.stringify({
          "longUrl" : longUrl,
          "expire" : true
        })
      }else{
        body = JSON.stringify({
          "longUrl" : longUrl,
          "expire" : false
        })
      }
      const response = await fetch("http://localhost:3001/api/shorten", {
        headers: {
        'Content-Type': 'application/json',
        },
        method: "POST",
        body: body
      })
      const data = await response.json();
      if(response.ok){
        generateShortUrl = data.data;
      }
      console.log('shortUrl generato ricevuto:', data.data);
      
    } catch (error) {
        console.log(error);
    }
  }

  async function handleSubmitRetrieve() {
    loading2 = true;
    console.log('shortUrl', longUrl);
    
    // fake loading2
    setTimeout(() => {
      loading2 = false;
    }, 500);

    try {
      shortUrl = shortUrl.split("/").pop() ?? shortUrl;
      const response = await fetch("http://localhost:3001/api/" + shortUrl, {
        method: "GET",
      })
      console.log(response);
      const data = await response.json();
      if(response.ok){
        longUrlReceived = data.data;
      }else {
        longUrlReceived = "Not found :("
      }
      console.log('longUrl ricevuto:', data.data);
      
    } catch (error) {
        console.log(error)
      
    }
    
  }

  

  function toggleOptions() {
    showOptions = !showOptions;
  }

  function resetShorten() {
    longUrl = '';
    generateShortUrl = '';
    showOptions = false;
    expireEnabled = false;
    
    // reset
    if (textArea1) {
      textArea1.style.height = 'auto';
    }
  }

  function resetRetrieve() {
    shortUrl = '';
    longUrlReceived = '';
    
    // reset
    if (textArea2) {
      textArea2.style.height = 'auto';
    }
  }

</script>

<div class="flex min-h-screen flex-col items-center justify-center">
  <div class="w-full max-w-2xl px-10">
    <!-- il bind server a collegare l'elemtno textarea html alla variabile textArea -->
    <!-- o anche il contenuto -->
    <!-- funzione chiamata quando si scrive -->
    <textarea 
      bind:this={textArea1} 
      bind:value={longUrl}
      on:input={autoResize}
      spellcheck="false"
      autocomplete="off"
      autocapitalize="off"
      placeholder="enter you loong url..."
      class="caret-[#845FEE] overflow-y-auto min-h-[20px] text-sm w-full font-medium font-mono text-primary bg-transparent selection:bg-[#673CE3]/50 placeholder:text-primary/60 focus:outline-none resize-none"
    ></textarea>

    <!-- Pulsante e opzioni sulla stessa riga -->
    <div class="flex items-center justify-between w-full mt-10">
      <!-- Sezione pulsanti (sinistra) -->
      <div class="flex gap-1 flex-1">
        {#if generateShortUrl}
          <!-- Mostra il risultato invece del pulsante -->
          <div class="w-full text-sm font-medium py-2 px-4 text-green-400 bg-green-900/20 border border-green-500/30 px-4 py-2 rounded">
            {generateShortUrl}
          </div>
        {:else}
        <button
          on:click={handleSubmitShorten}
          disabled={loading1 || longUrl === ''}
          class="w-full text-sm font-semibold active:translate-y-[2px] transition rounded-l-lg rounded-r-sm py-2
                {loading1 || longUrl === '' 
                  ? 'bg-[#30303A]/50 text-[#9C95AC]/60 cursor-default' 
                  : 'purple-button bg-[#673CE3] hover:bg-[#774BF3] text-white'}"
        >
          {loading1 ? 'loading...' : 'generate'}
        </button>
        {/if}
        <!-- Pulsante opzioni -->
         {#if !generateShortUrl}
        <button
          on:click={toggleOptions}
          class="active:translate-y-[2px] bg-[#2D2A3D] selected-option py-2 transition flex justify-center items-center rounded-r-lg rounded-l-sm px-1.5 w-14"
        >
          <img class="w-5 h-5 pointer-events-none" src="/settings_icon.svg" alt="Options" />
        </button>
        {/if}
      </div>
      
      <!-- Reset button (destra) -->
      {#if generateShortUrl}
      <button
        on:click={resetShorten}
        class="ml-4 text-[#9C95AC] hover:text-white transition-colors duration-200 p-2"
        title="Reset all fields"
      >
        <img class="w-5 h-5 pointer-events-none" src="/reset.svg" alt="Reset" />
      </button>
      {/if}
      
      <!-- Opzioni (destra) -->
      {#if showOptions}
        <div class="flex items-center gap-4 ml-8">
          <span class="text-white text-sm font-semibold whitespace-nowrap">Expires After:</span>
          <div class="bg-[#2D2A3D] flex selected-option text-white text-sm rounded-md relative min-w-[120px]">
            <select 
              class="px-2.5 pr-7 py-1 bg-transparent text-white w-full custom-select" 
              bind:value={expireEnabled}
            >
              <option value={false}>No</option>
              <option value={true}>24 hours</option>
            </select>
            
            <!-- Icona freccia -->
            <div class="absolute top-1 right-1 w-5 h-5 pointer-events-none flex items-center justify-center">
              <svg class="w-3 h-3 text-[#9C95AC]" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      {/if}
    </div>

     <!-- Seconda textarea con spazio sopra -->
     <textarea 
      bind:this={textArea2} 
      bind:value={shortUrl}
      on:input={autoResize}
      spellcheck="false"
      autocomplete="off"
      autocapitalize="off"
      placeholder="enter you short url..."
      class="caret-[#845FEE] overflow-y-auto min-h-[20px] text-sm w-full font-medium font-mono text-primary bg-transparent selection:bg-[#673CE3]/50 placeholder:text-primary/60 focus:outline-none resize-none mt-40"
    ></textarea>
     
      <!-- Secondo pulsante sotto -->
      <div class="flex items-center justify-between w-full mt-10">
        <div class="flex gap-1 flex-1">
          {#if longUrlReceived}
            <!-- Mostra il risultato invece del pulsante -->
            <div class="w-full text-sm font-medium py-2 px-4 rounded-lg {longUrlReceived === 'Not found :(' ? 'text-red-400 bg-red-900/20 border border-red-500/30' : 'text-green-400 bg-green-900/20 border border-green-500/30 px-4 py-2 rounded'}">
              {longUrlReceived}
            </div>
          {:else}
          <button
           on:click={handleSubmitRetrieve}
           disabled={loading2 || shortUrl === ''}
           class="w-full text-sm font-semibold active:translate-y-[2px] transition rounded-lg py-2
                 {loading2 || shortUrl === '' 
                   ? 'bg-[#30303A]/50 text-[#9C95AC]/60 cursor-default' 
                   : 'purple-button bg-[#673CE3] hover:bg-[#774BF3] text-white'}"
          >
           {loading2 ? 'loading...' : 'get long url back'}
          </button>
          {/if}
        </div>
        
        <!-- Reset button (destra) - solo se c'è longUrlReceived -->
        {#if longUrlReceived}
        <button
          on:click={resetRetrieve}
          class="ml-4 text-[#9C95AC] hover:text-white transition-colors duration-200 p-2"
          title="Reset all fields"
        >
          <img class="w-5 h-5 pointer-events-none" src="/reset.svg" alt="Reset" />
        </button>
        {/if}
      </div>
  </div>
</div>

<style>
  .custom-select option {
    color: black;
    background-color: white;
  }
</style>