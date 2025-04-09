// Init Supabase client
export async function seedMessages(supabase, util) {
  // Shared defaults
  const defaultTenantId = "24d940cf-490c-4806-a46f-e995132d0883";
  const connectedServiceId = "b519d59a-a25a-4eb9-b402-10758d745fbb";
  const defaultUserId = "d32fa9df-957a-482c-acc0-8a2b7f112ca5";
  const defaultMetadata = {
    uuid: "12345",
    status: "draft",
    priority: 0,
  };

  const conversationIds = ["c36ab803-b9c1-4208-a792-009a0236a298"];

  // Seed helper
  async function createMessage(
    contentOverrides = {},
    metadataOverrides = {},
    timestamps = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ) {
    const content = {
      event: "email_received",
      summary:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      short_summary: "Lorem ipsum dolor sit amet.",
      email_id: "12345",
      provider: "outlook",
      reasoning:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      email_drafted: {
        to: "kitoclark1989@gmail.com",
        body: "Hi Kito,\r\n\r\nThank you for your test email! It appears to have come through successfully.\r\n\r\nCheers,\r\nLiam",
      },
      email_received: {
        to: "skybrook.ai@outlook.com",
        from: "kitoclark1989@gmail.com",
        from_name: "K Clark",
        thread: [],
        subject: "Testing the email",
        latest_message: {
          body: "Hi Liam,\r\nJust sending you a test email. Cheers\r\nKito\r\n",
          from: "K Clark",
          timestamp: "2025-04-09T02:50:04Z",
        },
      },
      function_calls: [],
      email_thread_id: "123456",
      normalization_summary:
        "K Clark sent a test email to Kito Clark with the subject 'Testing the email'. The content of the email is a brief message confirming that it is a test.",
      normalization_reasoning:
        "The email requires a response as it is a test email directed to the user. No additional context is needed for a reply.",
      ...contentOverrides,
    };

    const messageData = {
      tenant_id: defaultTenantId,
      user_id: defaultUserId,
      role: "email_agent",
      content: content,
      metadata: { ...defaultMetadata, ...metadataOverrides },
      connected_service_id: connectedServiceId,
    };

    const { data, error } = await supabase.rpc(
      "create_message_for_conversations",
      {
        conversation_ids: conversationIds,
        message_data: messageData,
      }
    );

    if (error) {
      console.error("❌ Error creating message:", error.message);
    } else {
      console.log("✅ Created message:", data);
    }
    await supabase.from("messages").update(timestamps).eq("id", data.id);
    return data;
  }

  // Seed script
  const statuses = ["draft", "sent"];
  const priorities = {
    0: 5,
    1: 4,
    2: 3,
    3: 2,
    4: 1,
  };

  const randomDateInTheLast3Days = () => {
    const now = new Date();
    const randomTime = Math.random() * 24 * 60 * 60 * 1000;
    const randomDate = new Date(now.getTime() + randomTime);
    return randomDate.toISOString();
  };

  for (const status of statuses) {
    console.log(`___________ Seeding ${status} messages... ___________`);

    const created_at = util.randomDateInLastNDays(3);

    for (const priority in priorities) {
      for (let i = 0; i < priorities[priority]; i++) {
        const identifier = `${status}-${priority}-${i}`;
        await createMessage(
          {
            short_summary: `[${identifier}] This is my short summary`,
            summary: `[${identifier}] Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
          },
          { status, priority, received_at: created_at },
          { created_at, updated_at: created_at }
        );
      }
    }
  }
}
