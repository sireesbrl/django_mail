document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Submit mail
  document.querySelector('#compose-form').addEventListener('submit', event => {
    event.preventDefault();
    send_mail();
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-details-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#email-details-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show mails in mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      // Show sent mails
      emails.forEach(email => {
        const email_div = document.createElement('div');
        email_div.className = 'list-group';
        email_div.innerHTML = `
        <span class='email-timestamp'>${email.timestamp}</span><br>
        <span class='email-sender'>From: ${email.sender}</span><br>
        <span class='email-recipients'>To: ${email.recipients}</span><br>
        <span class='email-subject'>Subject: ${email.subject}</span>
      `;
        
        // Change email_div color according read unread
        if(!email.read){
          email_div.style.backgroundColor = 'rgb(226, 226, 226)';
          email_div.style.color = 'black';
          email_div.style.borderColor = 'gray';
        } else {
          email_div.style.backgroundColor = 'rgb(80, 80, 80)';
          email_div.style.color = 'white';
          email_div.style.borderColor = 'black';
        }
        // Open mails
        email_div.addEventListener('click', function() {
            console.log(`Opening email id: ${email.id}`);
            // clear screen and display mail
            open_mail(email.id);
        });
        document.querySelector('#emails-view').append(email_div);
       
      });
  });

}

function open_mail(email_id) {
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(mail => {
    console.log(mail);

    // Show email details view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-details-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    document.querySelector('#email-details-view').innerHTML = `
    <strong>From</strong>: ${mail.sender}<br>
    <strong>To</strong>: ${mail.recipients}<br>
    <strong>Subject</strong>: ${mail.subject}<br>
    <strong>Timestamp</strong>: ${mail.timestamp}<br>
    <hr>
    <br>
    ${mail.body}<br>
    `;

    if(!mail.read){
      fetch(`/emails/${mail.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      })
    }

    // Reply button
    const reply = document.createElement('button');
    reply.innerHTML = 'Reply';
    reply.className = 'btn btn-sm btn-outline-primary';
    reply.addEventListener('click', () => {
      compose_email();
      document.querySelector('#compose-recipients').value = mail.sender;
      let subject = mail.subject;
      if (subject.slice(0,3) !== 'Re:'){
        subject = 'Re: ' + mail.subject;
      }
      document.querySelector('#compose-subject').value = subject;
      document.querySelector('#compose-body').value = `"On ${mail.timestamp} ${mail.sender} wrote:\n${mail.body}"\n\n`;
    })
    document.querySelector('#email-details-view').append(reply);

    // Archive button
    const archive = document.createElement('button');
    archive.innerHTML = mail.archived? 'Unarchive' : 'Archive';
    archive.className = mail.archived? 'btn btn-sm btn-outline-success' : 'btn btn-sm btn-outline-danger';
    archive.addEventListener('click', ()  => {
        fetch(`/emails/${mail.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: !mail.archived
          })
        })
        .then(() => {
          load_mailbox('archive')
        })
    })
    document.querySelector('#email-details-view').append(archive);

  });

  
}

function send_mail(){

  // Store data
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    // Print result
    console.log(result);
    load_mailbox('sent');
  });

}