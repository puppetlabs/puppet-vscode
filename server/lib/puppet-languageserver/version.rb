module PuppetLanguageServer
  if not defined? PUPPETLANGUAGESERVERVERSION then
    PUPPETLANGUAGESERVERVERSION = '0.0.1'
  end

  # @api public
  #
  # @return [String] containing the langauge server version, e.g. "0.4.0"
  def self.version
    version_file = File.join(File.dirname(__FILE__), 'VERSION')
    return @lang_server_version if @lang_server_version
    if version = read_version_file(version_file)
      @lang_server_version = version
    end
    @lang_server_version ||= PUPPETLANGUAGESERVERVERSION
  end

  # Sets the langauge server version
  # Typically only used in testing
  #
  # @return [void]
  #
  # @api private
  def self.version=(version)
    @lang_server_version = version
  end

  # @api private
  #
  # @return [String] the version -- for example: "0.4.0" or nil if the VERSION
  #   file does not exist.
  def self.read_version_file(path)
    if File.exists?(path)
      File.read(path).chomp
    end
  end
  private_class_method :read_version_file
end
