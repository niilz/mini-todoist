registerSettingsPage(({ settings }) => (
  <Page>
    <Section
      title={
        <Text bold align="center">
          App Settings
        </Text>
      }>
      <TextInput label='Enter your todoist API token' settingsKey='api-key'/>
      <Text>You can access your todoist API token under integrations, in the web-portal of your todoist account:</Text>
      <Link source='https://todoist.com/prefs/integrations'>https://todoist.com/prefs/integrations</Link>
    </Section>
  </Page>
));
