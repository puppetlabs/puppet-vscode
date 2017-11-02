module PuppetVSCode
  def self.log_message(severity, message)
    return if @logger.nil?

    case severity
    when :debug
      @logger.debug(message)
    when :info
      @logger.info(message)
    when :warn
      @logger.info(message)
    when :error
      @logger.error(message)
    when :fatal
      @logger.fatal(message)
    else
      @logger.unknown(message)
    end
  end

  def self.init_logging(options)
    if options[:debug].nil?
      @logger = nil
    elsif options[:debug].casecmp 'stdout'
      @logger = Logger.new($stdout)
    elsif !options[:debug].to_s.empty?
      # Log to file
      @logger = Logger.new(options[:debug])
    end
  end
end