document.addEventListener('DOMContentLoaded', function() {
  let current_mailbox = '';

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Submit handler
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id) {
  // Show the mailbox and hide other views
  document.querySelector('#email-detail').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    // Print email
    console.log(email);

    document.querySelector('#email-detail').innerHTML = `
    <div class="list-group-item margin-bottom">
      <h6><strong>From:</strong>${email.sender}</h6>
      <h6><strong>To:</strong>${email.recipients}</h6>
      <h6><strong>Subject:</strong>${email.subject}</h6>
      <h6><strong>Time:</strong>${email.timestamp}</h6>
      <div class="underline">
        <h6>${email.body}</h6>
      </div>
    </div>
    `;

    if(!email.read) {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }

    const btn_archive = document.createElement('button');
    btn_archive.className = !email.archived ? "btn btn-info margin-right" : "btn btn-secondary margin-right";
    btn_archive.innerHTML = !email.archived ? "archive" : "unarchive";
    btn_archive.addEventListener('click', () => {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: !email.archived
        })
      })
      .then(() => {load_mailbox('archive')})
    });

    const btn_reply = document.createElement('button');
    btn_reply.className = "btn btn-success";
    btn_reply.innerHTML = "Reply";
    btn_reply.addEventListener('click', () => {
      compose_email();

      document.querySelector('#compose-recipients').value = email.sender;
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
      document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
    });

    if (current_mailbox != 'sent') {
      document.querySelector('#email-detail').append(btn_archive);
      document.querySelector('#email-detail').append(btn_reply);
    }

  })
}

function load_mailbox(mailbox) {
  current_mailbox = mailbox;

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get the emails for that mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
        // Loop through each email and create a div for each
        emails.forEach(singleEmail => {
          console.log(singleEmail);

          const read_status = singleEmail.read ? "read" : "unread"; // if the email was read then using 'read' class in CSS and vice versa

          // Create dive for each email
          const email = document.createElement('div');
          email.innerHTML = `
          <div class="list-group-item ${read_status}">
            <h6><strong>From:</strong>${singleEmail.sender}</h6>
            <h6><strong>To:</strong>${singleEmail.recipients}</h6>
            <h6><strong>Subject:</strong>${singleEmail.subject}</h6>
            <h6><strong>Time:</strong>${singleEmail.timestamp}</h6>
          </div>
          `;

          // Add click event to view the email
          email.addEventListener('click', function() {
            view_email(singleEmail.id)
          });
          document.querySelector('#emails-view').append(email);
        })
    });
  }


function send_email(event) {
  event.preventDefault();

  // Store data
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Send data to backend
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
    console.log(result);
    load_mailbox('sent');
  });
}
