<template>
    <div class="service">
  <div class="service-title">
    <h1 class="service-title__title">
      Every tool you need to work with PDFs in one place
    </h1>

    <p class="service-title__subtitle">
      Easily manage and transform your PDF files with fast, secure, and reliable tools.
      Convert, edit, and optimize documents in just a few clicks — no installation required.
    </p>

    <p class="service-title__services">
      Our all-in-one PDF solutions include
      <strong>PDF to Word</strong>,
      <strong>Word to PDF</strong>,
      <strong>PDF to Excel</strong>,
      <strong>Merge PDFs</strong>,
      <strong>Split PDFs</strong>,
      <strong>Compress PDFs</strong>,
      <strong>Unlock protected PDFs</strong>,
      and many more tools designed to save your time and boost productivity.
    </p>
  </div>
</div>


    
</template>
<style scoped>
.service {
    margin-inline: 10px;
}  
.service-title {
    text-align: center;
    margin-top: 50px;
} 
.service-title__title{
    font-weight: 600;
    font-size: 42px;
    line-height: 52px;
    color: #33333b;
    text-align: center;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 4px;
}
.service-title__subtitle {
    line-height: 32px;
    font-size: 22px;
    font-weight: 400;
    color: #47474f;
    max-width: 980px;
    margin: auto;
}
.service-title__services {
  margin-top: 15px;
  font-size: 15px;
  color: #555;
    max-width: 800px;
  line-height: 1.6;
  margin: auto;
}
@media (max-width: 1024px){
    .service-title__title{
        font-size: 28px;
        line-height: 40px;
    }
    .service-title__subtitle {
        font-size: 16px;
        line-height: 28px;
    }
    .service-title__services {
      font-size: 12px;
    }
}


</style>