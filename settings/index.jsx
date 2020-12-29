registerSettingsPage(({ settings }) => (
  <Page>
    <Section
      title={
        <Text bold align="center">
          App Settings
        </Text>
      }>
      <Text>Please enter your todoist API token</Text>
      <TextInput label='click here to enter token' settingsKey='api-token' placeholder='api token'/>
      <Text>Info: You can access your todoist API token through the web-portal of your todoist account:</Text>
      <Link source='https://todoist.com/prefs/integrations'>https://todoist.com/prefs/integrations</Link>
    </Section>
  </Page>
));
